"use client";

import { useAuth } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

import { SocketContext } from "@/contexts/socket";
import { socketService } from "@/services/socketService";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@shared/types/socket";

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

      const socketInstance = socketService.initialize(token);

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
      socketService.disconnect();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    initializeSocket();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        emit: socketService.emit.bind(socketService),
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
