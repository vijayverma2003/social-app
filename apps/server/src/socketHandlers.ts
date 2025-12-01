import { Server, Socket } from "socket.io";
import { clerkMiddleware, getAuth } from "@clerk/express";
import { Request } from "express";
import { FriendRequestHandlers } from "./socketHandlers/friendRequestHandlers";
import prisma from "@database/postgres";

interface AuthenticatedSocket extends Socket {
  userId?: string;
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

        await new Promise<void>((resolve, reject) => {
          const middleware = clerkMiddleware();
          middleware(request, {} as any, (err?: any) => {
            if (err) reject(err);
            else resolve();
          });
        });

        const { userId, isAuthenticated } = getAuth(request);

        if (!isAuthenticated || !userId) {
          return next(new Error("Invalid or expired token"));
        }

        const user = await prisma.user.findUnique({
          where: { clerkId: userId },
        });

        if (!user) return next(new Error("User not found"));

        socket.userId = userId;

        next();
      } catch (error) {
        console.error("Socket authentication error:", error);
        next(new Error("Authentication failed"));
      }
    });

    this.io.on("connection", (socket: AuthenticatedSocket) => {
      console.log(`User connected: ${socket.id} (userId: ${socket.userId})`);

      if (socket.userId) socket.join(`user:${socket.userId}`);

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
