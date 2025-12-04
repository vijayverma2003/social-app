"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@clerk/nextjs";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@shared/types/socket";

interface SocketContextType {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isConnected: boolean;
  emit: <K extends keyof ClientToServerEvents>(
    event: K,
    data: Parameters<ClientToServerEvents[K]>[0],
    callback: Parameters<ClientToServerEvents[K]>[1]
  ) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  emit: () => {},
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketContextProvider: React.FC<SocketProviderProps> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isSignedIn, getToken } = useAuth();

  const initializeSocket = async () => {
    try {
      const token = await getToken();

      if (!token) {
        console.error("No authentication token available");
        return;
      }

      const serverUrl =
        process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";

      const socketInstance: Socket<ServerToClientEvents, ClientToServerEvents> =
        io(serverUrl, {
          extraHeaders: {
            Authorization: `Bearer ${token}`,
          },
          autoConnect: true,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

      socketInstance.on("connect", () => {
        console.log("Socket connected:", socketInstance.id);
        setIsConnected(true);
      });

      socketInstance.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        setIsConnected(false);
      });

      socketInstance.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setIsConnected(false);
      });

      setSocket(socketInstance);
    } catch (error) {
      console.error("Failed to initialize socket:", error);
    }
  };

  useEffect(() => {
    if (!isSignedIn) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    initializeSocket();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [isSignedIn, getToken]);

  const emit = <K extends keyof ClientToServerEvents>(
    event: K,
    data: Parameters<ClientToServerEvents[K]>[0],
    callback: Parameters<ClientToServerEvents[K]>[1]
  ): void => {
    if (!socket || !isConnected) {
      callback({ error: "Socket not connected" });
      return;
    }

    (socket.emit as any)(event, data, callback);
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, emit }}>
      {children}
    </SocketContext.Provider>
  );
};
