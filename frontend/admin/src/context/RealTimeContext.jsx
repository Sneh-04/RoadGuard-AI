import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const RealTimeContext = createContext(null);

export function RealTimeProvider({ children }) {
  const [hazards, setHazards] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [socket, setSocket] = useState(null);

  // Fetch initial hazards
  useEffect(() => {
    const fetchInitialHazards = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/events');
        const data = await response.json();
        if (data.events && Array.isArray(data.events)) {
          setHazards(data.events);
        }
      } catch (error) {
        console.error('Failed to fetch initial hazards:', error);
      }
    };

    fetchInitialHazards();
  }, []);

  // WebSocket connection
  useEffect(() => {
    let reconnectTimer;
    let currentSocket;

    const connectWebSocket = () => {
      try {
        currentSocket = new WebSocket('ws://localhost:8000/ws/events');

        currentSocket.addEventListener('open', () => {
          console.log('✅ WebSocket connected');
          setConnectionStatus('connected');
          setSocket(currentSocket);
        });

        currentSocket.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'new_event' && data.event) {
              console.log('📍 New hazard received:', data.event);
              setHazards((prev) => [data.event, ...prev].slice(0, 500));
            } else if (data.type === 'event_status_updated' && data.event_id) {
              console.log(`📝 Hazard ${data.event_id} status updated to: ${data.status}`);
              setHazards((prev) =>
                prev.map((h) =>
                  h.id === data.event_id ? { ...h, status: data.status } : h
                )
              );
            } else if (data.type === 'snapshot' && data.events) {
              console.log('📸 Snapshot received:', data.events.length, 'hazards');
              setHazards(data.events);
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        });

        currentSocket.addEventListener('close', () => {
          console.log('⚠️ WebSocket disconnected');
          setConnectionStatus('reconnecting');
          reconnectTimer = setTimeout(connectWebSocket, 3000);
        });

        currentSocket.addEventListener('error', (error) => {
          console.error('❌ WebSocket error:', error);
          setConnectionStatus('error');
        });
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        setConnectionStatus('error');
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (currentSocket?.readyState === WebSocket.OPEN) {
        currentSocket.close();
      }
    };
  }, []);

  // Function to handle admin actions
  const updateHazardStatus = useCallback(async (hazardId, status) => {
    try {
      const response = await fetch(`http://localhost:8000/api/events/${hazardId}/${status}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update local state
        setHazards((prev) =>
          prev.map((h) =>
            h.id === hazardId
              ? { ...h, status: status === 'solve' ? 'solved' : 'ignored' }
              : h
          )
        );
        return true;
      }
    } catch (error) {
      console.error('Failed to update hazard status:', error);
    }
    return false;
  }, []);

  // Function to add a new hazard (from upload)
  const addHazard = useCallback((hazard) => {
    setHazards((prev) => [hazard, ...prev].slice(0, 500));
  }, []);

  const value = {
    hazards,
    connectionStatus,
    updateHazardStatus,
    addHazard,
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
}

export function useRealTime() {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTime must be used within RealTimeProvider');
  }
  return context;
}
