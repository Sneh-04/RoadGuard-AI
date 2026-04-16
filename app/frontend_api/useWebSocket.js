/*
useWebSocket.js

React hook that wraps the WebSocket functions from predictService.js.
- Connects to ws://127.0.0.1:8000/ws/hazards by default
- Manages connection state: 'idle' | 'connecting' | 'open' | 'closed' | 'error'
- Tracks last received message and error state
- Exposes: connect(), disconnect(), send(message)
- Uses PredictService.connectWebSocket / closeWebSocket / sendWebSocketMessage
- Avoids duplicate connections
- Cleans up on unmount
- Auto-reconnect delegated to PredictService (configured here)

Example usage:

import React, { useEffect } from 'react';
import useWebSocket from './app/frontend_api/useWebSocket';

function HazardStream() {
  const { status, lastMessage, error, connect, disconnect, send } = useWebSocket();

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  useEffect(() => {
    if (lastMessage) {
      console.log('Received hazard message:', lastMessage);
    }
  }, [lastMessage]);

  return (
    <div>
      <div>WS status: {status}</div>
      {error && <div style={{color: 'red'}}>Error: {String(error.message || error)}</div>}
      <button onClick={() => send({ ping: Date.now() })} disabled={status !== 'open'}>Send Ping</button>
    </div>
  );
}

*/

import { useCallback, useEffect, useRef, useState } from 'react';
import PredictService from './predictService';

const DEFAULT_WS_URL = 'ws://127.0.0.1:8000/ws/hazards';

export default function useWebSocket({ url = DEFAULT_WS_URL, maxReconnectAttempts = 10, reconnectBaseMs = 1000 } = {}) {
  const [status, setStatus] = useState('idle');
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);

  const connectedRef = useRef(false); // prevents duplicate connections
  const manualCloseRef = useRef(false);

  // Stable callbacks refs to avoid re-registering
  const onOpenRef = useRef(null);
  const onMessageRef = useRef(null);
  const onCloseRef = useRef(null);
  const onErrorRef = useRef(null);

  // connect() establishes the PredictService WebSocket and registers callbacks
  const connect = useCallback(() => {
    if (connectedRef.current || status === 'connecting') {
      console.debug('[useWebSocket] Already connected or connecting — skipping');
      return;
    }

    manualCloseRef.current = false;
    setStatus('connecting');
    setError(null);

    // Define callbacks
    const onOpen = (ev) => {
      console.info('[useWebSocket] open');
      connectedRef.current = true;
      setStatus('open');
      if (typeof onOpenRef.current === 'function') onOpenRef.current(ev);
    };

    const onMessage = (msg) => {
      // msg may be object or string
      setLastMessage(msg);
      if (typeof onMessageRef.current === 'function') onMessageRef.current(msg);
    };

    const onClose = (ev) => {
      console.warn('[useWebSocket] closed', ev);
      connectedRef.current = false;
      if (!manualCloseRef.current) {
        setStatus('connecting'); // PredictService will attempt reconnect; reflect transitional state
      } else {
        setStatus('closed');
      }
      if (typeof onCloseRef.current === 'function') onCloseRef.current(ev);
    };

    const onError = (ev) => {
      console.error('[useWebSocket] error', ev);
      setError(ev);
      setStatus('error');
      if (typeof onErrorRef.current === 'function') onErrorRef.current(ev);
    };

    // Configure PredictService reconnect options via connectWebSocket args
    try {
      PredictService.connectWebSocket({
        url,
        maxReconnectAttempts,
        reconnectBaseMs,
        onOpen,
        onMessage,
        onClose,
        onError,
      });
    } catch (err) {
      console.error('[useWebSocket] connect failed', err);
      setError(err);
      setStatus('error');
    }
  }, [url, maxReconnectAttempts, reconnectBaseMs, status]);

  const disconnect = useCallback(() => {
    manualCloseRef.current = true;
    try {
      PredictService.closeWebSocket();
    } catch (err) {
      console.warn('[useWebSocket] closeWebSocket error', err);
    }
    connectedRef.current = false;
    setStatus('closed');
  }, []);

  const send = useCallback((message) => {
    if (!connectedRef.current) {
      const err = new Error('WebSocket not open');
      setError(err);
      throw err;
    }
    try {
      PredictService.sendWebSocketMessage(message);
    } catch (err) {
      console.error('[useWebSocket] send failed', err);
      setError(err);
      throw err;
    }
  }, []);

  // Expose a way for the consumer to attach custom event handlers
  const setOnOpen = useCallback((fn) => { onOpenRef.current = fn; }, []);
  const setOnMessage = useCallback((fn) => { onMessageRef.current = fn; }, []);
  const setOnClose = useCallback((fn) => { onCloseRef.current = fn; }, []);
  const setOnError = useCallback((fn) => { onErrorRef.current = fn; }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      manualCloseRef.current = true;
      try { PredictService.closeWebSocket(); } catch (e) { /* ignore */ }
      connectedRef.current = false;
    };
  }, []);

  return {
    // state
    status,
    lastMessage,
    error,

    // actions
    connect,
    disconnect,
    send,

    // optional event setters
    setOnOpen,
    setOnMessage,
    setOnClose,
    setOnError,
  };
}
