/*
usePredict.js

React hook wrapper for PredictService (app/frontend_api/predictService.js).
- Manages loading, error, and response data state
- Exposes: predict(payload, options), reset()
- Supports retries via PredictService.predictWithRetries
- Uses AbortController to mark/cancel requests on unmount
- Prevents state updates when component is unmounted
- Functional hooks only; React 19 compatible

Example usage:

import React from 'react';
import usePredict from './app/frontend_api/usePredict';

function PredictButton() {
  const { loading, error, data, predict, reset } = usePredict();

  const handleClick = async () => {
    const payload = { data: Array.from({ length: 100 }, () => [0.0, 0.0, 0.0]) };
    try {
      const result = await predict(payload, { maxRetries: 3 });
      console.log('Prediction result:', result);
    } catch (err) {
      console.error('Prediction failed:', err);
    }
  };

  return (
    <div>
      <button onClick={handleClick} disabled={loading}>
        {loading ? 'Predicting…' : 'Run Prediction'}
      </button>
      {error && <div style={{ color: 'red' }}>Error: {String(error.message || error)}</div>} 
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      <button onClick={reset}>Reset</button>
    </div>
  );
}

*/

import { useState, useRef, useEffect, useCallback } from 'react';
import PredictService from './predictService';

function usePredict() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Track mounted state to prevent updates after unmount
  const mountedRef = useRef(true);
  // Keep AbortController for the current request
  const abortRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Abort ongoing request if any
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch (e) { /* ignore */ }
        abortRef.current = null;
      }
    };
  }, []);

  const reset = useCallback(() => {
    if (!mountedRef.current) return;
    setLoading(false);
    setError(null);
    setData(null);
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch (e) { /* ignore */ }
      abortRef.current = null;
    }
  }, []);

  /**
   * predict(payload, options)
   * options:
   *  - maxRetries: number (optional)
   *  - url: override URL (optional)
   *  - timeoutMs: per-request timeout (optional)
   *  - retryBaseMs: base backoff (optional)
   *  - onRetry: callback({attempt, delay, error})
   */
  const predict = useCallback(async (payload, options = {}) => {
    // Abort previous request if any
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch (e) { /* ignore */ }
      abortRef.current = null;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    if (!mountedRef.current) {
      controller.abort();
      return Promise.reject(new Error('Component unmounted'));
    }

    setLoading(true);
    setError(null);

    try {
      let result;

      // If retries requested, use predictWithRetries wrapper
      if (options && (typeof options.maxRetries === 'number' || options.useRetries)) {
        const retryOptions = {
          maxRetries: options.maxRetries ?? 3,
          url: options.url,
          timeoutMs: options.timeoutMs,
          onRetry: options.onRetry,
          retryBaseMs: options.retryBaseMs,
        };

        // Poll for abort between retries by racing the abort signal
        const promise = PredictService.predictWithRetries(payload, retryOptions);
        result = await Promise.race([
          promise,
          new Promise((_, reject) => {
            controller.signal.addEventListener('abort', () => reject(new Error('aborted')));
          }),
        ]);
      } else {
        // Single attempt
        const promise = PredictService.predict(payload, { url: options.url, timeoutMs: options.timeoutMs });
        result = await Promise.race([
          promise,
          new Promise((_, reject) => {
            controller.signal.addEventListener('abort', () => reject(new Error('aborted')));
          }),
        ]);
      }

      if (!mountedRef.current || controller.signal.aborted) {
        // Do not update state on unmounted
        return result;
      }

      setData(result);
      setLoading(false);
      return result;
    } catch (err) {
      // If aborted, return a specific error
      if (controller.signal && controller.signal.aborted) {
        // Treat as cancellation
        const abortErr = new Error('Request aborted');
        abortErr.name = 'AbortError';
        if (mountedRef.current) {
          setLoading(false);
          setError(abortErr);
        }
        return Promise.reject(abortErr);
      }

      if (mountedRef.current) {
        setError(err);
        setLoading(false);
      }
      return Promise.reject(err);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, []);

  return {
    loading,
    error,
    data,
    predict,
    reset,
  };
}

export default usePredict;
