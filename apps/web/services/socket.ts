import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@shared/types/socket";

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
    null;
  private isInitialized = false;

  /**
   * Initialize the socket connection with authentication token
   * @param token - Authentication token from Clerk
   * @returns The socket instance
   */
  initialize(
    token: string
  ): Socket<ServerToClientEvents, ClientToServerEvents> {
    // If socket already exists and is connected, return it
    if (this.socket && this.socket.connected) return this.socket;

    // If socket exists but not connected, disconnect and create new one
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
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

    this.socket = socketInstance;
    this.isInitialized = true;

    return socketInstance;
  }

  /**
   * Get the current socket instance
   * @returns The socket instance or null if not initialized
   */
  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }

  /**
   * Disconnect the socket and clean up
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isInitialized = false;
    }
  }

  /**
   * Check if socket is initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Emit an event to the server
   * @param event - The event name
   * @param data - The event data
   * @param callback - The callback function
   */
  emit<K extends keyof ClientToServerEvents>(
    event: K,
    data: Parameters<ClientToServerEvents[K]>[0],
    callback: Parameters<ClientToServerEvents[K]>[1]
  ): void {
    if (!this.socket) return;

    const isConnected = this.socket.connected;

    if (!isConnected) {
      const timeout = setTimeout(() => {
        callback({ error: "Socket connection timeout" });
      }, 30_000);

      console.log(`Calling ${event} with data:`, data);

      this.socket.once("connect", () => {
        clearTimeout(timeout);
        (this.socket!.emit as any)(event, data, callback);
      });

      this.socket.once("connect_error", () => {
        clearTimeout(timeout);
        callback({ error: "Socket connection failed" });
      });

      return;
    }

    (this.socket.emit as any)(event, data, callback);
  }
}

// Export singleton instance
export const socketService = new SocketService();
