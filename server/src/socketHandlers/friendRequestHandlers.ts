import { Server, Socket } from "socket.io";
import prisma from "@database";
import {
  FriendRequestActionInputSchema,
  SendFriendRequestInputSchema,
} from "@shared/schemas/friends";
import { FRIEND_REQUEST_EVENTS } from "@shared/socketEvents";
import { SendFriendRequestInput } from "@shared/schemas/friends";
interface AuthenticatedSocket extends Socket {
  userId?: string;
}

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
    cb: (response: { error?: string; success?: boolean; data?: any }) => void
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

      const receiver = await prisma.user.findUnique({
        where: { username_discriminator: { username, discriminator } },
      });
      if (!receiver) return cb({ error: "Receiver not found" });

      const sender = await prisma.user.findUnique({
        where: { id: socket.userId },
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

      this.io
        .to(`user:${receiver.id}`)
        .emit(FRIEND_REQUEST_EVENTS.RECEIVED, friendRequest);

      cb({
        success: true,
        data: friendRequest,
      });
    } catch (error) {
      console.error("Error sending friend request:", error);
      cb({ error: "Failed to send friend request" });
    }
  }

  private async acceptFriendRequest(
    socket: AuthenticatedSocket,
    data: any,
    callback: (response: any) => void
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
        .emit(FRIEND_REQUEST_EVENTS.ACCEPTED, friendRequest);

      callback({
        success: true,
        message: "Friend request accepted successfully",
      });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      callback({ error: "Failed to accept friend request" });
    }
  }

  private async rejectFriendRequest(
    socket: AuthenticatedSocket,
    data: any,
    cb: (response: any) => void
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
        .emit(FRIEND_REQUEST_EVENTS.REJECTED, friendRequest);

      cb({
        success: true,
        message: "Friend request rejected successfully",
      });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      cb({ error: "Failed to reject friend request" });
    }
  }
}
