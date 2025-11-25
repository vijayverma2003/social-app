import { Server, Socket } from "socket.io";
import { User } from "../entities/User";
import FriendRequests from "../entities/FriendRequests";
import { FriendRequestData } from "../../../shared/schemas/friends";
import { FRIEND_REQUEST_EVENTS } from "../../../shared/socketEvents";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  mongoUserId?: string;
}

export class FriendRequestHandlers {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * Set up friend request event handlers
   */
  public setupHandlers(socket: AuthenticatedSocket) {
    // Handle friend request send
    socket.on(FRIEND_REQUEST_EVENTS.SEND, async (data, callback) => {
      try {
        if (!socket.mongoUserId) {
          return callback?.({ error: "Unauthorized" });
        }

        const { receiverId } = data;

        // Validate receiverId
        if (!receiverId) {
          return callback?.({ error: "Receiver ID is required" });
        }

        // Check if user is trying to send request to themselves
        if (socket.mongoUserId === receiverId) {
          return callback?.({
            error: "Cannot send friend request to yourself",
          });
        }

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
          return callback?.({ error: "Receiver not found" });
        }

        // Check if friend request already exists
        const existingRequests = await FriendRequests.findRequestsBySenderId(
          socket.mongoUserId
        );
        const duplicateRequest = existingRequests.find(
          (req) => req.receiverId === receiverId
        );
        if (duplicateRequest) {
          return callback?.({ error: "Friend request already exists" });
        }

        // Create friend request
        const friendRequest = await FriendRequests.create({
          senderId: socket.mongoUserId,
          receiverId,
        });

        // Emit event to receiver
        this.io.to(`user:${receiverId}`).emit(FRIEND_REQUEST_EVENTS.RECEIVED, {
          _id: friendRequest._id.toString(),
          senderId: friendRequest.senderId,
          receiverId: friendRequest.receiverId,
          createdAt: friendRequest.createdAt,
        });

        // Send success response
        callback?.({
          success: true,
          data: {
            _id: friendRequest._id.toString(),
            senderId: friendRequest.senderId,
            receiverId: friendRequest.receiverId,
            createdAt: friendRequest.createdAt,
          },
        });
      } catch (error) {
        console.error("Error sending friend request:", error);
        callback?.({ error: "Failed to send friend request" });
      }
    });

    // Handle friend request accept
    socket.on(FRIEND_REQUEST_EVENTS.ACCEPT, async (data, callback) => {
      try {
        if (!socket.mongoUserId) {
          return callback?.({ error: "Unauthorized" });
        }

        const { requestId } = data;

        if (!requestId) {
          return callback?.({ error: "Request ID is required" });
        }

        // Find the friend request
        const friendRequest = await FriendRequests.findRequestById(requestId);
        if (!friendRequest) {
          return callback?.({ error: "Friend request not found" });
        }

        // Check if user is the receiver of the request
        if (friendRequest.receiverId !== socket.mongoUserId) {
          return callback?.({
            error: "You can only accept friend requests sent to you",
          });
        }

        // Delete the friend request
        const deleted = await FriendRequests.deleteRequestById(requestId);
        if (!deleted) {
          return callback?.({ error: "Failed to accept friend request" });
        }

        // Emit event to sender
        this.io
          .to(`user:${friendRequest.senderId}`)
          .emit(FRIEND_REQUEST_EVENTS.ACCEPTED, {
            _id: friendRequest._id.toString(),
            senderId: friendRequest.senderId,
            receiverId: friendRequest.receiverId,
            createdAt: friendRequest.createdAt,
          });

        // Send success response
        callback?.({
          success: true,
          message: "Friend request accepted successfully",
        });
      } catch (error) {
        console.error("Error accepting friend request:", error);
        callback?.({ error: "Failed to accept friend request" });
      }
    });

    // Handle friend request reject
    socket.on(FRIEND_REQUEST_EVENTS.REJECT, async (data, callback) => {
      try {
        if (!socket.mongoUserId) {
          return callback?.({ error: "Unauthorized" });
        }

        const { requestId } = data;

        if (!requestId) {
          return callback?.({ error: "Request ID is required" });
        }

        // Find the friend request
        const friendRequest = await FriendRequests.findRequestById(requestId);
        if (!friendRequest) {
          return callback?.({ error: "Friend request not found" });
        }

        // Check if user is the receiver of the request
        if (friendRequest.receiverId !== socket.mongoUserId) {
          return callback?.({
            error: "You can only reject friend requests sent to you",
          });
        }

        // Delete the friend request
        const deleted = await FriendRequests.deleteRequestById(requestId);
        if (!deleted) {
          return callback?.({ error: "Failed to reject friend request" });
        }

        // Emit event to sender
        this.io
          .to(`user:${friendRequest.senderId}`)
          .emit(FRIEND_REQUEST_EVENTS.REJECTED, {
            _id: friendRequest._id.toString(),
            senderId: friendRequest.senderId,
            receiverId: friendRequest.receiverId,
            createdAt: friendRequest.createdAt,
          });

        // Send success response
        callback?.({
          success: true,
          message: "Friend request rejected successfully",
        });
      } catch (error) {
        console.error("Error rejecting friend request:", error);
        callback?.({ error: "Failed to reject friend request" });
      }
    });
  }

  /**
   * Emit friend request received event to a specific user
   */
  public emitFriendRequestReceived(
    receiverId: string,
    data: FriendRequestData & { _id: string }
  ) {
    this.io.to(`user:${receiverId}`).emit(FRIEND_REQUEST_EVENTS.RECEIVED, data);
  }

  /**
   * Emit friend request accepted event to a specific user
   */
  public emitFriendRequestAccepted(
    senderId: string,
    data: FriendRequestData & { _id: string }
  ) {
    this.io.to(`user:${senderId}`).emit(FRIEND_REQUEST_EVENTS.ACCEPTED, data);
  }

  /**
   * Emit friend request rejected event to a specific user
   */
  public emitFriendRequestRejected(
    senderId: string,
    data: FriendRequestData & { _id: string }
  ) {
    this.io.to(`user:${senderId}`).emit(FRIEND_REQUEST_EVENTS.REJECTED, data);
  }
}
