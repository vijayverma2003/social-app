import { Server as HttpServer } from "http";
import { Server } from "socket.io";

class SocketIOProvider {
  private static _instance: Server | null = null;

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

    this._instance.on("connection", (socket) => {
      console.log("A user connected:", socket.id);

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });

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
}

export default SocketIOProvider;
