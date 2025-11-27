import { Friend } from "../entities/Friend";
import { Server, Socket } from "socket.io";
import {
  FriendRequestActionInputSchema,
  FriendRequestData,
  SendFriendRequestInputSchema,
} from "../../../shared/schemas/friends";
import { FRIEND_REQUEST_EVENTS } from "../../../shared/socketEvents";
import FriendRequests from "../entities/FriendRequests";
import { User } from "../entities/User";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  mongoUserId?: string;
}

export class FriendRequestHandlers {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  public setupHandlers(socket: AuthenticatedSocket) {
    socket.on(FRIEND_REQUEST_EVENTS.SEND, (data, callback) =>
      this.handleSendFriendRequest(socket, data, callback)
    );

    socket.on(FRIEND_REQUEST_EVENTS.ACCEPT, (data, callback) =>
      this.handleAcceptFriendRequest(socket, data, callback)
    );

    socket.on(FRIEND_REQUEST_EVENTS.REJECT, (data, callback) =>
      this.handleRejectFriendRequest(socket, data, callback)
    );
  }

  /**
   * Handle sending a friend request.
   *
   * @param socket - Authenticated socket instance
   * @param data - Request data containing receiverTag (e.g., username#0000)
   * @param callback - Optional callback function for response
   *
   * @validation
   * - User must be authenticated
   * - receiverTag is required and must be valid
   * - User cannot send request to themselves
   * - Receiver must exist in database
   * - No duplicate requests allowed
   *
   * @emits friend_request:received - Sent to receiver's room with request data
   *
   * @returns Callback with success status and created request data, or error message
   */
  private async handleSendFriendRequest(
    socket: AuthenticatedSocket,
    data: any,
    callback?: (response: any) => void
  ) {
    try {
      if (!socket.mongoUserId) {
        return callback?.({ error: "Unauthorized" });
      }

      const validationResult = SendFriendRequestInputSchema.safeParse(data);
      if (!validationResult.success) {
        return callback?.({
          error: validationResult.error.issues[0]?.message || "Invalid input",
        });
      }

      const { receiverTag } = validationResult.data;
      const [username, discriminator] = receiverTag.split("#");

      if (!username || !discriminator) {
        return callback?.({ error: "Invalid friend tag format" });
      }

      const receiver = await User.findByUsernameAndDiscriminator(
        username,
        discriminator
      );

      if (!receiver) {
        return callback?.({ error: "Receiver not found" });
      }

      const receiverId = receiver._id.toString();

      const sender = await User.findById(socket.mongoUserId);
      if (!sender) {
        return callback?.({ error: "Sender not found" });
      }

      if (socket.mongoUserId === receiverId) {
        return callback?.({
          error: "Cannot send friend request to yourself",
        });
      }

      const existingRequests = await FriendRequests.findRequestsBySenderId(
        socket.mongoUserId
      );
      const duplicateRequest = existingRequests.find(
        (req) => req.receiverId === receiverId
      );
      if (duplicateRequest) {
        return callback?.({ error: "Friend request already exists" });
      }

      const friendRequest = await FriendRequests.create({
        senderId: socket.mongoUserId,
        receiverId,
        senderUsername: sender.username,
        senderAvatarURL: sender.avatarURL,
        receiverUsername: receiver.username,
        receiverAvatarURL: receiver.avatarURL,
      });

      this.io
        .to(`user:${receiverId}`)
        .emit(FRIEND_REQUEST_EVENTS.RECEIVED, friendRequest);

      callback?.({
        success: true,
        data: friendRequest,
      });
    } catch (error) {
      console.error("Error sending friend request:", error);
      callback?.({ error: "Failed to send friend request" });
    }
  }

  /**
   * Handle accepting a friend request.
   *
   * @param socket - Authenticated socket instance
   * @param data - Request data containing requestId
   * @param callback - Optional callback function for response
   *
   * @validation
   * - User must be authenticated
   * - requestId is required
   * - Friend request must exist
   * - User must be the receiver of the request
   *
   * @emits friend_request:accepted - Sent to sender's room with request data
   *
   * @returns Callback with success message or error message
   */
  private async handleAcceptFriendRequest(
    socket: AuthenticatedSocket,
    data: any,
    callback?: (response: any) => void
  ) {
    try {
      if (!socket.mongoUserId) {
        return callback?.({ error: "Unauthorized" });
      }

      const validationResult = FriendRequestActionInputSchema.safeParse(data);
      if (!validationResult.success) {
        return callback?.({
          error: validationResult.error.issues[0]?.message || "Invalid input",
        });
      }

      const { requestId } = validationResult.data;

      const friendRequest = await FriendRequests.findRequestById(requestId);
      if (!friendRequest) {
        return callback?.({ error: "Friend request not found" });
      }

      if (friendRequest.receiverId !== socket.mongoUserId) {
        return callback?.({
          error: "You can only accept friend requests sent to you",
        });
      }

      await Friend.createFriend(socket.mongoUserId, friendRequest.senderId);

      const deleted = await FriendRequests.deleteRequestById(requestId);
      if (!deleted) {
        return callback?.({ error: "Failed to accept friend request" });
      }

      this.io
        .to(`user:${friendRequest.senderId}`)
        .emit(FRIEND_REQUEST_EVENTS.ACCEPTED, friendRequest);

      callback?.({
        success: true,
        message: "Friend request accepted successfully",
      });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      callback?.({ error: "Failed to accept friend request" });
    }
  }

  /**
   * Handle rejecting a friend request.
   *
   * @param socket - Authenticated socket instance
   * @param data - Request data containing requestId
   * @param callback - Optional callback function for response
   *
   * @validation
   * - User must be authenticated
   * - requestId is required
   * - Friend request must exist
   * - User must be the receiver of the request
   *
   * @emits friend_request:rejected - Sent to sender's room with request data
   *
   * @returns Callback with success message or error message
   */
  private async handleRejectFriendRequest(
    socket: AuthenticatedSocket,
    data: any,
    callback?: (response: any) => void
  ) {
    try {
      if (!socket.mongoUserId) {
        return callback?.({ error: "Unauthorized" });
      }

      const validationResult = FriendRequestActionInputSchema.safeParse(data);
      if (!validationResult.success) {
        return callback?.({
          error: validationResult.error.issues[0]?.message || "Invalid input",
        });
      }

      const { requestId } = validationResult.data;

      const friendRequest = await FriendRequests.findRequestById(requestId);
      if (!friendRequest) {
        return callback?.({ error: "Friend request not found" });
      }

      if (friendRequest.receiverId !== socket.mongoUserId) {
        return callback?.({
          error: "You can only reject friend requests sent to you",
        });
      }

      const deleted = await FriendRequests.deleteRequestById(requestId);
      if (!deleted) {
        return callback?.({ error: "Failed to reject friend request" });
      }

      this.io
        .to(`user:${friendRequest.senderId}`)
        .emit(FRIEND_REQUEST_EVENTS.REJECTED, friendRequest);

      callback?.({
        success: true,
        message: "Friend request rejected successfully",
      });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      callback?.({ error: "Failed to reject friend request" });
    }
  }

  /**
   * Emit friend request received event to a specific user.
   *
   * @param receiverId - MongoDB user ID of the recipient
   * @param data - Friend request data including _id, senderId, receiverId, and createdAt
   *
   * @emits friend_request:received - Sent to receiver's personal room
   */
  public emitFriendRequestReceived(
    receiverId: string,
    data: FriendRequestData & { _id: string }
  ) {
    this.io.to(`user:${receiverId}`).emit(FRIEND_REQUEST_EVENTS.RECEIVED, data);
  }

  /**
   * Emit friend request accepted event to a specific user.
   *
   * @param senderId - MongoDB user ID of the original sender
   * @param data - Friend request data including _id, senderId, receiverId, and createdAt
   *
   * @emits friend_request:accepted - Sent to sender's personal room
   */
  public emitFriendRequestAccepted(
    senderId: string,
    data: FriendRequestData & { _id: string }
  ) {
    this.io.to(`user:${senderId}`).emit(FRIEND_REQUEST_EVENTS.ACCEPTED, data);
  }

  /**
   * Emit friend request rejected event to a specific user.
   *
   * @param senderId - MongoDB user ID of the original sender
   * @param data - Friend request data including _id, senderId, receiverId, and createdAt
   *
   * @emits friend_request:rejected - Sent to sender's personal room
   */
  public emitFriendRequestRejected(
    senderId: string,
    data: FriendRequestData & { _id: string }
  ) {
    this.io.to(`user:${senderId}`).emit(FRIEND_REQUEST_EVENTS.REJECTED, data);
  }
}
