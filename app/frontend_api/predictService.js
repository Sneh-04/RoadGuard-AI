/*
predictService.js

Standalone React-compatible API integration module for RoadGuard-AI.
Features:
 - Uses fetch() with explicit POST and JSON body
 - Handles HTTP 400/405/500 and network errors with clear messages
 - Loading state management
 - Retry logic with exponential backoff + jitter
 - WebSocket client with auto-reconnect and event callbacks
 - No external dependencies, no Antigravity abstractions

Usage example:
import PredictService from './app/frontend_api/predictService';

// Simple POST
const result = await PredictService.predict({ data: [[0.1,0.2,0.3], ...] });

// With retries
const result = await PredictService.predictWithRetries(payload, { maxRetries: 3 });

// WebSocket
PredictService.connectWebSocket({
  onOpen: () => console.log('WS open'),
  onMessage: msg => console.log('WS message', msg),
  onClose: () => console.log('WS closed'),
  onError: err => console.error('WS error', err),
});

*/

const DEFAULT_PREDICT_URL = 'http://127.0.0.1:8000/api/predict';
const DEFAULT_WS_URL = 'ws://127.0.0.1:8000/ws/hazards';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function jitter(base) {
  return Math.floor(base * (0.5 + Math.random()));
}

const PredictService = (() => {
  // internal state
  let isLoading = false;
  let lastError = null;

  // WebSocket state
  let ws = null;
  let wsUrl = DEFAULT_WS_URL;
  let wsOptions = { reconnectAttempts: 0, maxReconnectAttempts: 10, reconnectBaseMs: 1000 };
  let wsManualClose = false;
  const wsCallbacks = {
    onOpen: null,
    onClose: null,
    onError: null,
    onMessage: null,
  };

  // Exposed getters
  function getLoading() {
    return isLoading;
  }
  function getLastError() {
    return lastError;
  }

  // Core POST method (single attempt)
  async function predict(payload, { url = DEFAULT_PREDICT_URL, timeoutMs = 15000 } = {}) {
    // Ensure method is POST and content-type is JSON
    isLoading = true;
    lastError = null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.debug('[PredictService] POST', url, 'payload=', payload);
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);

      // Handle HTTP codes explicitly
      if (resp.status === 400) {
        const bodyText = await resp.text();
        const err = new Error(`Bad Request (400): ${bodyText}`);
        err.status = 400;
        throw err;
      }
      if (resp.status === 405) {
        const bodyText = await resp.text();
        const err = new Error(`Method Not Allowed (405): ${bodyText}`);
        err.status = 405;
        throw err;
      }
      if (resp.status >= 500) {
        const bodyText = await resp.text();
        const err = new Error(`Server Error (${resp.status}): ${bodyText}`);
        err.status = resp.status;
        throw err;
      }

      // Other non-2xx
      if (!resp.ok) {
        const bodyText = await resp.text();
        const err = new Error(`HTTP ${resp.status}: ${bodyText}`);
        err.status = resp.status;
        throw err;
      }

      // Parse JSON safely
      const data = await resp.json();
      console.debug('[PredictService] Response OK', data);
      return data;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.error('[PredictService] Request timed out');
        lastError = new Error('Request timed out');
        lastError.code = 'TIMEOUT';
        throw lastError;
      }
      console.error('[PredictService] Request failed', err);
      lastError = err;
      throw err;
    } finally {
      isLoading = false;
      try { clearTimeout(timer); } catch (e) {}
    }
  }

  // Retry wrapper with exponential backoff + jitter
  async function predictWithRetries(payload, options = {}) {
    const {
      maxRetries = 3,
      url = DEFAULT_PREDICT_URL,
      timeoutMs = 15000,
      onRetry = null,
      retryBaseMs = 500,
    } = options;

    let attempt = 0;
    while (true) {
      try {
        attempt += 1;
        console.debug(`[PredictService] Attempt ${attempt}`);
        const res = await predict(payload, { url, timeoutMs });
        return res;
      } catch (err) {
        const retriable = isRetriableError(err);
        if (!retriable) {
          console.debug('[PredictService] Not retriable, throwing', err);
          throw err;
        }
        if (attempt > maxRetries) {
          console.error('[PredictService] Exceeded max retries');
          throw err;
        }
        const backoff = retryBaseMs * Math.pow(2, attempt - 1);
        const delay = jitter(backoff);
        console.warn(`[PredictService] Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        if (typeof onRetry === 'function') {
          try { onRetry({ attempt, delay, error: err }); } catch (e) { console.warn(e); }
        }
        await sleep(delay);
        continue;
      }
    }
  }

  function isRetriableError(err) {
    if (!err) return false;
    if (err.code === 'TIMEOUT') return true;
    if (!err.status) return true; // network error likely
    // Retry on 5xx
    if (err.status >= 500 && err.status < 600) return true;
    // Do not retry on 4xx (client errors), except maybe 429
    if (err.status === 429) return true;
    return false;
  }

  // WebSocket implementation with auto reconnect
  function connectWebSocket({ url = DEFAULT_WS_URL, maxReconnectAttempts = 10, reconnectBaseMs = 1000, onOpen = null, onMessage = null, onClose = null, onError = null } = {}) {
    // attach callbacks
    wsCallbacks.onOpen = onOpen;
    wsCallbacks.onMessage = onMessage;
    wsCallbacks.onClose = onClose;
    wsCallbacks.onError = onError;

    wsUrl = url;
    wsOptions.maxReconnectAttempts = maxReconnectAttempts;
    wsOptions.reconnectBaseMs = reconnectBaseMs;
    wsManualClose = false;
    wsOptions.reconnectAttempts = 0;

    if (ws) {
      try { ws.close(); } catch (e) { console.warn('close existing ws failed', e); }
      ws = null;
    }

    _createWebSocket();
  }

  function _createWebSocket() {
    if (wsOptions.reconnectAttempts > wsOptions.maxReconnectAttempts) {
      console.error('[PredictService] Max WS reconnect attempts reached');
      return;
    }

    console.debug('[PredictService] Connecting WS to', wsUrl);
    try {
      ws = new WebSocket(wsUrl);
    } catch (err) {
      console.error('[PredictService] WebSocket creation failed', err);
      _scheduleReconnect();
      return;
    }

    ws.addEventListener('open', (ev) => {
      console.info('[PredictService] WS open');
      wsOptions.reconnectAttempts = 0; // reset
      if (typeof wsCallbacks.onOpen === 'function') wsCallbacks.onOpen(ev);
    });

    ws.addEventListener('message', (ev) => {
      // assume text/json payload
      let payload = ev.data;
      try {
        payload = JSON.parse(ev.data);
      } catch (e) {
        // not JSON, pass raw
      }
      console.debug('[PredictService] WS message', payload);
      if (typeof wsCallbacks.onMessage === 'function') wsCallbacks.onMessage(payload);
    });

    ws.addEventListener('close', (ev) => {
      console.warn('[PredictService] WS closed', ev);
      if (typeof wsCallbacks.onClose === 'function') wsCallbacks.onClose(ev);
      if (!wsManualClose) _scheduleReconnect();
    });

    ws.addEventListener('error', (ev) => {
      console.error('[PredictService] WS error', ev);
      if (typeof wsCallbacks.onError === 'function') wsCallbacks.onError(ev);
      // close socket to trigger reconnect logic
      try { ws.close(); } catch (e) {}
    });
  }

  function _scheduleReconnect() {
    wsOptions.reconnectAttempts = (wsOptions.reconnectAttempts || 0) + 1;
    const attempt = wsOptions.reconnectAttempts;
    const backoff = wsOptions.reconnectBaseMs * Math.pow(2, attempt - 1);
    const delay = jitter(backoff);
    if (attempt > wsOptions.maxReconnectAttempts) {
      console.error('[PredictService] Will not reconnect WS anymore');
      return;
    }
    console.info(`[PredictService] Reconnecting WS in ${delay}ms (attempt ${attempt})`);
    setTimeout(() => {
      _createWebSocket();
    }, delay);
  }

  function closeWebSocket() {
    wsManualClose = true;
    if (ws) {
      try { ws.close(); } catch (e) { console.warn('close ws error', e); }
      ws = null;
    }
  }

  function sendWebSocketMessage(msg) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not open');
    }
    const payload = (typeof msg === 'string') ? msg : JSON.stringify(msg);
    ws.send(payload);
  }

  // Public API
  return {
    // Status
    getLoading,
    getLastError,

    // Prediction
    predict, // single attempt
    predictWithRetries,

    // WebSocket
    connectWebSocket,
    closeWebSocket,
    sendWebSocketMessage,

    // internal for debugging
    _internal: {
      get ws() { return ws; },
      get wsOptions() { return wsOptions; },
    }
  };
})();

export default PredictService;
