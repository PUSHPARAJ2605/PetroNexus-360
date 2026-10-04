import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { LiveTelemetryState } from '../types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  liveState: LiveTelemetryState | null;
  toggleAnomaly: (active: boolean) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [liveState, setLiveState] = useState<LiveTelemetryState | null>(null);

  useEffect(() => {
    // Connect to server (supports VITE_SOCKET_URL for Render or fallback to origin)
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const newSocket = io(socketUrl, {
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('request_state');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('telemetry_tick', (state: LiveTelemetryState) => {
      setLiveState(state);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const toggleAnomaly = (active: boolean) => {
    fetch('/api/simulator/anomaly-toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.currentState) {
          setLiveState(data.currentState);
        }
      })
      .catch((err) => console.error('Error toggling anomaly:', err));
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, liveState, toggleAnomaly }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
