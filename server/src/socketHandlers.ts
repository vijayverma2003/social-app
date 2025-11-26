import { Server, Socket } from "socket.io";
import { getAuth } from "@clerk/express";
import { Request } from "express";
import { User } from "./entities/User";
import { FriendRequestHandlers } from "./socketHandlers/friendRequestHandlers";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  mongoUserId?: string;
}

export class SocketHandlers {
  private io: Server;
  private friendRequestHandlers: FriendRequestHandlers;

  constructor(io: Server) {
    this.io = io;
    this.friendRequestHandlers = new FriendRequestHandlers(io);
  }

  public initialize() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const request = socket.request as Request;
        const { userId, isAuthenticated } = getAuth(request);

        if (!isAuthenticated || !userId) {
          return next(new Error("Unauthorized"));
        }

        const user = await User.findByClerkId(userId);
        if (!user) {
          return next(new Error("User not found"));
        }

        socket.userId = userId;
        socket.mongoUserId = user._id.toString();

        next();
      } catch (error) {
        next(new Error("Authentication failed"));
      }
    });

    this.io.on("connection", (socket: AuthenticatedSocket) => {
      console.log(
        `User connected: ${socket.id} (userId: ${socket.mongoUserId})`
      );

      if (socket.mongoUserId) socket.join(`user:${socket.mongoUserId}`);

      this.friendRequestHandlers.setupHandlers(socket);

      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
      });
    });
  }

  public get friendRequests(): FriendRequestHandlers {
    return this.friendRequestHandlers;
  }
}
