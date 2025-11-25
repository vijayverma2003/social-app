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

  /**
   * Initialize socket middleware and event handlers
   */
  public initialize() {
    // Middleware to authenticate socket connections
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const request = socket.request as Request;
        const { userId, isAuthenticated } = getAuth(request);

        if (!isAuthenticated || !userId) {
          return next(new Error("Unauthorized"));
        }

        // Find the MongoDB user ID from Clerk ID
        const user = await User.findByClerkId(userId);
        if (!user) {
          return next(new Error("User not found"));
        }

        // Attach user IDs to socket
        socket.userId = userId;
        socket.mongoUserId = user._id.toString();

        next();
      } catch (error) {
        next(new Error("Authentication failed"));
      }
    });

    // Connection handler
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      console.log(
        `User connected: ${socket.id} (userId: ${socket.mongoUserId})`
      );

      // Join user to their personal room for targeted events
      if (socket.mongoUserId) {
        socket.join(`user:${socket.mongoUserId}`);
      }

      // Set up event handlers for different entities
      this.friendRequestHandlers.setupHandlers(socket);

      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Get friend request handlers instance
   */
  public get friendRequests(): FriendRequestHandlers {
    return this.friendRequestHandlers;
  }
}
