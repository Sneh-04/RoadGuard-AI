/**
 * useSensorSimulation Hook
 * ========================
 * Custom React hook for managing real-time sensor simulation
 * Handles lifecycle, state updates, and cleanup
 */

import { useEffect, useRef, useCallback } from 'react';
import { startSensorSimulation } from '../utils/sensorSimulation.js';

/**
 * Hook to run sensor simulation in a component
 * @param {Function} onHazardDetected - Callback when hazard is detected
 * @param {number} interval - Sensor reading interval in ms (default: 2500)
 * @param {boolean} enabled - Whether simulation should be active (default: true)
 */
export function useSensorSimulation(onHazardDetected, interval = 2500, enabled = true) {
  const cleanupRef = useRef(null);
  const isRunningRef = useRef(false);

  const startSimulation = useCallback(() => {
    if (isRunningRef.current) return; // Prevent duplicate loops
    
    isRunningRef.current = true;
    cleanupRef.current = startSensorSimulation(onHazardDetected, interval);
  }, [onHazardDetected, interval]);

  const stopSimulation = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    isRunningRef.current = false;
  }, []);

  useEffect(() => {
    if (enabled) {
      startSimulation();
    } else {
      stopSimulation();
    }

    return () => {
      stopSimulation();
    };
  }, [enabled, startSimulation, stopSimulation]);

  return {
    isRunning: isRunningRef.current,
    start: startSimulation,
    stop: stopSimulation,
  };
}
