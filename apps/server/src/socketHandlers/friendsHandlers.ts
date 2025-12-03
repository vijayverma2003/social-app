import prisma from "@database/postgres";
import { RemoveFriendInputSchema } from "@shared/schemas/friends";
import { FRIEND_EVENTS } from "@shared/socketEvents";
import { SocketResponse } from "@shared/types/responses";
import { Server } from "socket.io";
import { AuthenticatedSocket } from "../socketHandlers";

export class FriendsHandlers {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  public setupHandlers(socket: AuthenticatedSocket) {
    socket.on(FRIEND_EVENTS.REMOVE, (data, callback) =>
      this.removeFriend(socket, data, callback)
    );
  }

  private async removeFriend(
    socket: AuthenticatedSocket,
    data: any,
    cb: (response: SocketResponse<{ friendId: string }>) => void
  ) {
    try {
      if (!socket.userId) return cb({ error: "Unauthorized" });

      const validationResult = RemoveFriendInputSchema.safeParse(data);
      if (!validationResult.success)
        return cb({
          error: validationResult.error.issues[0]?.message || "Invalid input",
        });

      const { friendId } = validationResult.data;

      // Find the friend relationship
      const friendRelationship = await prisma.friend.findUnique({
        where: { id: friendId },
      });

      if (!friendRelationship)
        return cb({ error: "Friend relationship not found" });

      // Verify the user owns this friend relationship
      if (friendRelationship.userId !== socket.userId)
        return cb({
          error: "You can only remove your own friends",
        });

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
        userId: socket.userId,
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
