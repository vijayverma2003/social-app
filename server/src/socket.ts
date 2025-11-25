import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { SocketHandlers } from "./socketHandlers";

class SocketIOProvider {
  private static _instance: Server | null = null;
  private static _handlers: SocketHandlers | null = null;

  public static initialize(httpServer: HttpServer): Server {
    if (this._instance) {
      return this._instance;
    }

    this._instance = new Server(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
        credentials: true,
      },
    });

    // Initialize socket handlers
    this._handlers = new SocketHandlers(this._instance);
    this._handlers.initialize();

    return this._instance;
  }

  public static get instance(): Server {
    if (!this._instance) {
      throw new Error(
        "Socket.io not initialized! Call SocketIOProvider.initialize() first."
      );
    }
    return this._instance;
  }

  public static get handlers(): SocketHandlers {
    if (!this._handlers) {
      throw new Error(
        "Socket handlers not initialized! Call SocketIOProvider.initialize() first."
      );
    }
    return this._handlers;
  }
}

export default SocketIOProvider;
