import prisma from "@database/postgres";
import {
  FriendRequestActionInputSchema,
  SendFriendRequestInput,
  SendFriendRequestInputSchema,
} from "@shared/schemas/friends";
import { FRIEND_REQUEST_EVENTS } from "@shared/socketEvents";
import {
  FriendRequestResponse,
  FriendRequestsListResponse,
  SocketResponse,
} from "@shared/types/responses";
import { Server } from "socket.io";
import { AuthenticatedSocket } from "../socketHandlers";

export class FriendRequestHandlers {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  public setupHandlers(socket: AuthenticatedSocket) {
    socket.on(FRIEND_REQUEST_EVENTS.SEND, (data, callback) =>
      this.sendFriendRequest(socket, data, callback)
    );

    socket.on(FRIEND_REQUEST_EVENTS.ACCEPT, (data, callback) =>
      this.acceptFriendRequest(socket, data, callback)
    );

    socket.on(FRIEND_REQUEST_EVENTS.REJECT, (data, callback) =>
      this.rejectFriendRequest(socket, data, callback)
    );
  }

  private async sendFriendRequest(
    socket: AuthenticatedSocket,
    data: SendFriendRequestInput,
    cb: (response: SocketResponse<FriendRequestsListResponse>) => void
  ) {
    try {
      if (!socket.userId) return cb({ error: "Unauthorized" });

      const validationResult = SendFriendRequestInputSchema.safeParse(data);
      if (!validationResult.success)
        return cb({ error: validationResult.error.message });

      const { receiverTag } = validationResult.data;
      const [username, discriminator] = receiverTag.split("#");

      if (!username || !discriminator)
        return cb({ error: "Invalid friend tag format" });

      console.log(username, discriminator);

      const receiver = await prisma.user.findUnique({
        where: { username_discriminator: { username, discriminator } },
        include: { profile: true },
      });
      if (!receiver) return cb({ error: "Receiver not found" });

      const sender = await prisma.user.findUnique({
        where: { id: socket.userId },
        include: { profile: true },
      });

      if (!sender) return cb({ error: "Sender not found" });

      if (socket.userId === receiver.id)
        return cb({ error: "Cannot send friend request to yourself" });

      // Check if users are already friends
      const existingFriends = await prisma.friend.findUnique({
        where: {
          userId_friendId: { userId: socket.userId, friendId: receiver.id },
        },
      });
      if (existingFriends)
        return cb({ error: "You are already friends with this user" });

      // Check whether the friend requests from both sender and receiver already exists
      const existingSenderRequest = await prisma.friendRequest.findUnique({
        where: {
          senderId_receiverId: {
            senderId: socket.userId,
            receiverId: receiver.id,
          },
        },
      });

      if (existingSenderRequest)
        return cb({
          error: "You have already sent a friend request to the person",
        });

      const existingReceiverRequest = await prisma.friendRequest.findUnique({
        where: {
          senderId_receiverId: {
            senderId: receiver.id,
            receiverId: socket.userId,
          },
        },
      });

      if (existingReceiverRequest)
        return cb({
          error: "The person has already sent you a friend request",
        });

      const friendRequest = await prisma.friendRequest.create({
        data: {
          senderId: socket.userId,
          receiverId: receiver.id,
        },
      });

      this.io.to(`user:${receiver.id}`).emit(FRIEND_REQUEST_EVENTS.RECEIVED, {
        id: friendRequest.id,
        username: sender?.username || "",
        discriminator: sender?.discriminator || "",
        profile: sender?.profile || null,
        createdAt: friendRequest.createdAt,
      } as FriendRequestsListResponse);

      cb({
        success: true,
        data: {
          id: friendRequest.id,
          username: receiver?.username || "",
          discriminator: receiver?.discriminator || "",
          profile: receiver?.profile || null,
          createdAt: friendRequest.createdAt,
        } as FriendRequestsListResponse,
      });
    } catch (error) {
      console.error("Error sending friend request:", error);
      cb({ error: "Failed to send friend request" });
    }
  }

  private async acceptFriendRequest(
    socket: AuthenticatedSocket,
    data: any,
    callback: (response: SocketResponse<{ requestId: string }>) => void
  ) {
    try {
      if (!socket.userId) {
        return callback({ error: "Unauthorized" });
      }

      const validationResult = FriendRequestActionInputSchema.safeParse(data);
      if (!validationResult.success)
        return callback({
          error: validationResult.error.issues[0]?.message || "Invalid input",
        });

      const { requestId } = validationResult.data;

      const friendRequest = await prisma.friendRequest.findUnique({
        where: { id: requestId },
      });
      if (!friendRequest)
        return callback({ error: "Friend request not found" });

      if (friendRequest.receiverId !== socket.userId)
        return callback({
          error: "You can only accept friend requests sent to you",
        });

      // If they are already friends, clean up the stale friend request
      const existingFriends = await prisma.friend.findUnique({
        where: {
          userId_friendId: {
            userId: socket.userId,
            friendId: friendRequest.senderId,
          },
        },
      });

      if (!existingFriends) {
        await prisma.$transaction([
          prisma.dMChannel.create({
            data: {
              users: {
                create: [
                  { userId: socket.userId },
                  { userId: friendRequest.senderId },
                ],
              },
              friends: {
                create: [
                  {
                    userId: socket.userId,
                    friendId: friendRequest.senderId,
                  },
                  {
                    userId: friendRequest.senderId,
                    friendId: socket.userId,
                  },
                ],
              },
            },
          }),
          prisma.friendRequest.delete({
            where: { id: requestId },
          }),
        ]);
      } else {
        await prisma.friendRequest.delete({
          where: { id: requestId },
        });
      }

      this.io
        .to(`user:${friendRequest.senderId}`)
        .emit(FRIEND_REQUEST_EVENTS.ACCEPTED, { requestId });

      callback({
        success: true,
        data: { requestId },
      });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      callback({ error: "Failed to accept friend request" });
    }
  }

  private async rejectFriendRequest(
    socket: AuthenticatedSocket,
    data: any,
    cb: (response: SocketResponse<{ requestId: string }>) => void
  ) {
    try {
      if (!socket.userId) return cb({ error: "Unauthorized" });

      const validationResult = FriendRequestActionInputSchema.safeParse(data);
      if (!validationResult.success)
        return cb({
          error: validationResult.error.issues[0]?.message || "Invalid input",
        });

      const { requestId } = validationResult.data;

      const friendRequest = await prisma.friendRequest.findUnique({
        where: { id: requestId },
      });

      if (!friendRequest) return cb({ error: "Friend request not found" });

      if (friendRequest.receiverId !== socket.userId)
        return cb({
          error: "You can only reject friend requests sent to you",
        });

      await prisma.friendRequest.delete({
        where: { id: requestId },
      });

      this.io
        .to(`user:${friendRequest.senderId}`)
        .emit(FRIEND_REQUEST_EVENTS.REJECTED, { requestId });

      cb({
        success: true,
        data: { requestId },
      });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      cb({ error: "Failed to reject friend request" });
    }
  }
}
