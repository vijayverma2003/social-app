import { Server, Socket } from "socket.io";
import { clerkMiddleware, getAuth } from "@clerk/express";
import { Request } from "express";
import { FriendRequestHandlers } from "./features/friends/socketHandlers/FriendRequestHandlers";
import { FriendsHandlers } from "./features/friends/socketHandlers/FriendsHandlers";
import { DMHandlers } from "./features/dms/socketHandlers/dmsHandlers";
import { MessageHandlers } from "./features/messages/socketHandlers/messageHandlers";
import prisma from "@database/postgres";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "@shared/types/socket";

export interface AuthenticatedSocket
  extends Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  > {
  userId?: string;
}

export class SocketHandlers {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private friendRequestHandlers: FriendRequestHandlers;
  private friendsHandlers: FriendsHandlers;
  private dmHandlers: DMHandlers;
  private messageHandlers: MessageHandlers;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
    this.friendRequestHandlers = new FriendRequestHandlers(io);
    this.friendsHandlers = new FriendsHandlers(io);
    this.dmHandlers = new DMHandlers(io);
    this.messageHandlers = new MessageHandlers(io);
  }

  public initialize() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const request = socket.request as Request;

        // Create a mock response object with methods Clerk middleware expects
        const mockResponse = {
          appendHeader: () => {},
          setHeader: () => {},
          getHeader: () => undefined,
          removeHeader: () => {},
          statusCode: 200,
          status: () => mockResponse,
          json: () => {},
          end: () => {},
        } as any;

        await new Promise<void>((resolve, reject) => {
          const middleware = clerkMiddleware();
          middleware(request, mockResponse, (err?: any) => {
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

        socket.userId = user.id;

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
      this.friendsHandlers.setupHandlers(socket);
      this.dmHandlers.setupHandlers(socket);
      this.messageHandlers.setupHandlers(socket);

      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
      });
    });
  }
}
