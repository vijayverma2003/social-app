import {
  FRIEND_REQUEST_EVENTS,
  FRIEND_EVENTS,
  DM_EVENTS,
} from "../socketEvents";
import { SocketResponse, FriendRequests, DMChannelsList } from "./responses";
import {
  SendFriendRequestPayload,
  RemoveFriendPayload,
  RejectFriendRequestPayload,
  CancelFriendRequestPayload,
  AcceptFriendRequestPayload,
} from "../schemas/friends";

/**
 * Socket Data Interface
 * Data attached to the socket connection
 */
export interface SocketData {
  userId?: string;
}

/**
 * Client to Server Events
 * Events that clients emit to the server (with callback responses)
 */
export interface ClientToServerEvents {
  // ============================================================================
  // FRIEND REQUEST EVENTS
  // ============================================================================

  /**
   * SEND: Client sends a friend request
   * @param data - { receiverTag: string } - Format: "username#0000"
   * @param callback - SocketResponse<FriendRequests> - Returns the created request with receiver info
   * @broadcasts RECEIVED to receiver
   */
  [FRIEND_REQUEST_EVENTS.SEND]: (
    data: SendFriendRequestPayload,
    callback: (response: SocketResponse<FriendRequests>) => void
  ) => void;

  /**
   * ACCEPT: Receiver accepts a friend request
   * @param data - { requestId: string }
   * @param callback - SocketResponse<{ requestId: string }>
   * @broadcasts ACCEPTED to sender
   */
  [FRIEND_REQUEST_EVENTS.ACCEPT]: (
    data: AcceptFriendRequestPayload,
    callback: (response: SocketResponse<{ requestId: string }>) => void
  ) => void;

  /**
   * REJECT: Receiver rejects a friend request
   * @param data - { requestId: string }
   * @param callback - SocketResponse<{ requestId: string }>
   * @broadcasts REJECTED to sender
   */
  [FRIEND_REQUEST_EVENTS.REJECT]: (
    data: RejectFriendRequestPayload,
    callback: (response: SocketResponse<{ requestId: string }>) => void
  ) => void;

  /**
   * CANCEL: Sender cancels their own friend request
   * @param data - { requestId: string }
   * @param callback - SocketResponse<{ requestId: string }>
   * @broadcasts CANCELED to receiver
   */
  [FRIEND_REQUEST_EVENTS.CANCEL]: (
    data: CancelFriendRequestPayload,
    callback: (response: SocketResponse<{ requestId: string }>) => void
  ) => void;

  // ============================================================================
  // FRIEND EVENTS
  // ============================================================================

  /**
   * REMOVE: Remove a friend relationship
   * @param data - { friendId: string } - The friend relationship ID
   * @param callback - SocketResponse<{ friendId: string }>
   * @broadcasts REMOVED to the other user
   */
  [FRIEND_EVENTS.REMOVE]: (
    data: RemoveFriendPayload,
    callback: (response: SocketResponse<{ friendId: string }>) => void
  ) => void;

  // ============================================================================
  // DM EVENTS
  // ============================================================================

  /**
   * GET_LIST: Get list of DM channels for the authenticated user
   * @param data - {} - No payload required
   * @param callback - SocketResponse<DMChannelsListResponse>
   */
  [DM_EVENTS.GET_LIST]: (
    data: {},
    callback: (response: SocketResponse<DMChannelsList>) => void
  ) => void;
}

/**
 * Server to Client Events
 * Events that the server emits to clients (notifications/broadcasts)
 */
export interface ServerToClientEvents {
  // ============================================================================
  // FRIEND REQUEST EVENTS
  // ============================================================================

  /**
   * RECEIVED: A new friend request was received
   * @emitted_to Receiver (via user:receiverId room)
   * @param data - FriendRequests - Contains sender's info (id, username, discriminator, profile, createdAt)
   */
  [FRIEND_REQUEST_EVENTS.RECEIVED]: (data: FriendRequests) => void;

  /**
   * ACCEPTED: A friend request was accepted
   * @emitted_to Sender (via user:senderId room)
   * @param data - { requestId: string }
   */
  [FRIEND_REQUEST_EVENTS.ACCEPTED]: (data: { requestId: string }) => void;

  /**
   * REJECTED: A friend request was rejected
   * @emitted_to Sender (via user:senderId room)
   * @param data - { requestId: string }
   */
  [FRIEND_REQUEST_EVENTS.REJECTED]: (data: { requestId: string }) => void;

  /**
   * CANCELED: A friend request was canceled
   * @emitted_to Receiver (via user:receiverId room)
   * @param data - { requestId: string }
   */
  [FRIEND_REQUEST_EVENTS.CANCELED]: (data: { requestId: string }) => void;

  // ============================================================================
  // FRIEND EVENTS
  // ============================================================================

  /**
   * REMOVED: A friend relationship was removed
   * @emitted_to The other user (via user:friend.friendId room)
   * @param data - { friendId: string } - The friend relationship ID
   */
  [FRIEND_EVENTS.REMOVED]: (data: { friendId: string }) => void;
}
