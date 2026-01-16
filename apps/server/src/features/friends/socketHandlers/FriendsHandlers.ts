import prisma from "@database/postgres";
import { RemoveFriendPayloadSchema } from "@shared/schemas/friends";
import { FRIEND_EVENTS } from "@shared/socketEvents";
import { FriendsList } from "@shared/types/responses";
import { ClientToServerEvents } from "@shared/types/socket";
import { BaseSocketHandler } from "../../../BaseSocketHandler";
import { AuthenticatedSocket } from "../../../socketHandlers";

// Extract types from ClientToServerEvents for type safety
type GetFriendsData = Parameters<
  ClientToServerEvents[typeof FRIEND_EVENTS.GET_LIST]
>[0];
type GetFriendsCallback = Parameters<
  ClientToServerEvents[typeof FRIEND_EVENTS.GET_LIST]
>[1];
type RemoveFriendData = Parameters<
  ClientToServerEvents[typeof FRIEND_EVENTS.REMOVE]
>[0];
type RemoveFriendCallback = Parameters<
  ClientToServerEvents[typeof FRIEND_EVENTS.REMOVE]
>[1];

export class FriendsHandlers extends BaseSocketHandler {
  public setupHandlers(socket: AuthenticatedSocket) {
    socket.on(FRIEND_EVENTS.GET_LIST, (data, callback) =>
      this.getFriends(socket, data, callback)
    );
    socket.on(FRIEND_EVENTS.REMOVE, (data, callback) =>
      this.removeFriend(socket, data, callback)
    );
  }

  private async getFriends(
    socket: AuthenticatedSocket,
    data: GetFriendsData,
    callback: GetFriendsCallback
  ) {
    try {
      if (!socket.userId) {
        callback({ error: "Unauthorized" });
        return;
      }

      const friendsData = await prisma.friend.findMany({
        where: {
          userId: socket.userId,
        },
        include: {
          friend: {
            select: {
              id: true,
              username: true,
              discriminator: true,
              profile: true,
            },
          },
        },
      });

      const friends: FriendsList[] = friendsData.map((friend) => ({
        id: friend.id,
        userId: friend.friend.id,
        username: friend.friend.username,
        discriminator: friend.friend.discriminator,
        channelId: friend.channelId,
        profile: friend.friend.profile,
      }));

      callback({
        success: true,
        data: friends,
      });
    } catch (error) {
      console.error("Error getting friends:", error);
      callback({ error: "Failed to get friends" });
    }
  }

  private async removeFriend(
    socket: AuthenticatedSocket,
    data: RemoveFriendData,
    cb: RemoveFriendCallback
  ) {
    try {
      if (!socket.userId) {
        cb({ error: "Unauthorized" });
        return;
      }

      const validationResult = RemoveFriendPayloadSchema.safeParse(data);
      if (!validationResult.success) {
        cb({
          error: validationResult.error.issues[0]?.message || "Invalid input",
        });
        return;
      }

      const { friendId } = validationResult.data;

      // Find the friend relationship
      const friendRelationship = await prisma.friend.findUnique({
        where: { id: friendId },
      });

      if (!friendRelationship) {
        cb({ error: "Friend relationship not found" });
        return;
      }

      // Verify the user owns this friend relationship
      if (friendRelationship.userId !== socket.userId) {
        cb({
          error: "You can only remove your own friends",
        });
        return;
      }

      const otherUserId = friendRelationship.friendId;

      // Find the reverse friend relationship
      const reverseFriendRelationship = await prisma.friend.findUnique({
        where: {
          userId_friendId: {
            userId: otherUserId,
            friendId: socket.userId,
          },
        },
      });

      // Delete both friend relationships
      await prisma.$transaction(async (tx) => {
        await tx.friend.delete({
          where: { id: friendId },
        });

        if (reverseFriendRelationship) {
          await tx.friend.delete({
            where: { id: reverseFriendRelationship.id },
          });
        }
      });

      this.io.to(`user:${otherUserId}`).emit(FRIEND_EVENTS.REMOVED, {
        friendId: reverseFriendRelationship?.id || friendId,
      });

      cb({
        success: true,
        data: { friendId },
      });
    } catch (error) {
      console.error("Error removing friend:", error);
      cb({ error: "Failed to remove friend" });
    }
  }
}
