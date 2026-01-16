import {
  FRIEND_REQUEST_EVENTS,
  FRIEND_EVENTS,
  CHANNEL_EVENTS,
  MESSAGE_EVENTS,
  UPLOAD_EVENTS,
  POST_EVENTS,
  USER_EVENTS,
} from "../socketEvents";
import {
  SocketResponse,
  FriendRequests,
  FriendsList,
  Profile,
  Channel,
  ChannelWithUsers,
} from "./responses";
import {
  SendFriendRequestPayload,
  RemoveFriendPayload,
  RejectFriendRequestPayload,
  CancelFriendRequestPayload,
  AcceptFriendRequestPayload,
} from "../schemas/friends";
import {
  JoinChannelPayload,
  LeaveChannelPayload,
  MarkChannelAsReadPayload,
} from "../schemas/dm";
import {
  CreateMessagePayload,
  GetMessagesPayload,
  EditMessagePayload,
  DeleteMessagePayload,
  MessageData,
} from "../schemas/messages";
import {
  UploadInitPayload,
  UploadCompletePayload,
  UploadInitialisedResponse,
  UploadCompletedResponse,
} from "../schemas/fileAttachment";
import { PostResponse } from "./posts";
import {
  CreatePostPayload,
  GetFeedPayload,
  GetRecentPostsPayload,
  JoinPostPayload,
  UpdatePostPayload,
  DeletePostPayload,
  LikePostPayload,
  RemoveLikePayload,
  BookmarkPostPayload,
  RemoveBookmarkPayload,
} from "./posts";
import { GetUserProfilesPayload, UpdateUserProfilePayload } from "./users";

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
   * GET_LIST: Get list of friends for the authenticated user
   * @param data - {} - No payload required
   * @param callback - SocketResponse<FriendsList[]> - Returns array of friends with profile and channelId
   */
  [FRIEND_EVENTS.GET_LIST]: (
    data: {},
    callback: (response: SocketResponse<FriendsList[]>) => void
  ) => void;

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
  // CHANNEL EVENTS
  // ============================================================================

  /**
   * GET_DMS_LIST: Get list of DM channels for the authenticated user
   * @param data - {} - No payload required
   * @param callback - SocketResponse<ChannelWithUsers[]>
   */
  [CHANNEL_EVENTS.GET_DMS_LIST]: (
    data: {},
    callback: (response: SocketResponse<ChannelWithUsers[]>) => void
  ) => void;

  /**
   * GET_POSTS_LIST: Get list of post channels for the authenticated user
   * @param data - {} - No payload required
   * @param callback - SocketResponse<Channel[]>
   */
  [CHANNEL_EVENTS.GET_POSTS_LIST]: (
    data: {},
    callback: (response: SocketResponse<Channel[]>) => void
  ) => void;

  /**
   * JOIN: Join a channel socket room for receiving broadcasts
   * @param data - { channelId: string }
   * @param callback - SocketResponse<JoinChannelPayload>
   * @requires User must be a member of the channel (ChannelUser record exists)
   * @broadcasts JOINED to channel room
   */
  [CHANNEL_EVENTS.JOIN]: (
    data: JoinChannelPayload,
    callback: (response: SocketResponse<{ channelId: string }>) => void
  ) => void;

  /**
   * LEAVE: Leave a channel socket room (stops receiving broadcasts)
   * @param data - { channelId: string }
   * @param callback - SocketResponse<LeaveChannelPayload>
   * @note This does not remove the user from the channel (ChannelUser record remains)
   * @broadcasts LEFT to channel room
   */
  [CHANNEL_EVENTS.LEAVE]: (
    data: LeaveChannelPayload,
    callback: (response: SocketResponse<LeaveChannelPayload>) => void
  ) => void;

  /**
   * MARK_AS_READ: Mark a channel as read (reset unread count to 0 and update lastReadAt)
   * @param data - { channelId: string }
   * @param callback - SocketResponse<{ channelId: string }>
   * @requires User must be a member of the channel
   * @broadcasts MARKED_AS_READ to user room
   */
  [CHANNEL_EVENTS.MARK_AS_READ]: (
    data: MarkChannelAsReadPayload,
    callback: (response: SocketResponse<{ channelId: string }>) => void
  ) => void;

  // ============================================================================
  // MESSAGE EVENTS
  // ============================================================================

  /**
   * CREATE: Create a new message in a channel
   * @param data - { channelId: string, channelType: "dm" | "post", content: string }
   * @param callback - SocketResponse<MessageData> - Returns the created message
   * @requires User must be a member of the channel
   * @broadcasts CREATED to channel room
   */
  [MESSAGE_EVENTS.CREATE]: (
    data: CreateMessagePayload,
    callback: (response: SocketResponse<MessageData>) => void
  ) => void;

  /**
   * GET: Get messages from a channel with pagination
   * @param data - { channelId: string, channelType: "dm" | "post", limit?: number, before?: string }
   * @param callback - SocketResponse<MessageData[]> - Returns array of messages
   * @requires User must be a member of the channel
   */
  [MESSAGE_EVENTS.GET]: (
    data: GetMessagesPayload,
    callback: (response: SocketResponse<MessageData[]>) => void
  ) => void;

  /**
   * EDIT: Edit a message in a channel
   * @param data - { messageId: string, channelId: string, channelType: "dm" | "post", content: string }
   * @param callback - SocketResponse<MessageData> - Returns the updated message
   * @requires User must be the author of the message and a member of the channel
   * @broadcasts EDITED to channel room
   */
  [MESSAGE_EVENTS.EDIT]: (
    data: EditMessagePayload,
    callback: (response: SocketResponse<MessageData>) => void
  ) => void;

  /**
   * DELETE: Delete a message from a channel
   * @param data - { messageId: string, channelId: string, channelType: "dm" | "post" }
   * @param callback - SocketResponse<{ messageId: string }> - Returns the deleted message ID
   * @requires User must be the author of the message and a member of the channel
   * @broadcasts DELETED to channel room
   */
  [MESSAGE_EVENTS.DELETE]: (
    data: DeleteMessagePayload,
    callback: (response: SocketResponse<{ messageId: string }>) => void
  ) => void;

  // ============================================================================
  // UPLOAD EVENTS
  // ============================================================================

  /**
   * INIT: Initialize file upload - creates file attachment record and returns presigned URL
   * @param data - { fileName: string, contentType: string, size: number, hash: string }
   * @param callback - SocketResponse<UploadInitialisedResponse> - Returns attachment ID and presigned URL (attachment ID is used as key)
   */
  [UPLOAD_EVENTS.INIT]: (
    data: UploadInitPayload,
    callback: (response: SocketResponse<UploadInitialisedResponse>) => void
  ) => void;

  /**
   * COMPLETE: Complete file upload - verifies hash and updates attachment status
   * @param data - { attachmentId: string, hash: string }
   * @param callback - SocketResponse<UploadCompletedResponse> - Returns attachment ID, URL, and status
   */
  [UPLOAD_EVENTS.COMPLETE]: (
    data: UploadCompletePayload,
    callback: (response: SocketResponse<UploadCompletedResponse>) => void
  ) => void;

  // ============================================================================
  // POST EVENTS
  // ============================================================================

  /**
   * CREATE: Create a new post
   * @param data - { content: string, storageObjectIds?: string[] }
   * @param callback - SocketResponse<PostData> - Returns the created post
   * @broadcasts CREATED to all users
   */
  [POST_EVENTS.CREATE]: (
    data: CreatePostPayload,
    callback: (response: SocketResponse<PostResponse>) => void
  ) => void;

  /**
   * UPDATE: Update an existing post
   * @param data - { postId: string, content: string, storageObjectIds?: string[] }
   * @param callback - SocketResponse<PostData> - Returns the updated post
   * @requires User must be the author of the post
   * @broadcasts UPDATED to all users
   */
  [POST_EVENTS.UPDATE]: (
    data: UpdatePostPayload,
    callback: (response: SocketResponse<PostResponse>) => void
  ) => void;

  /**
   * DELETE: Delete an existing post
   * @param data - { postId: string }
   * @param callback - SocketResponse<{ postId: string }> - Returns the deleted post ID
   * @requires User must be the author of the post
   * @broadcasts DELETED to all users
   */
  [POST_EVENTS.DELETE]: (
    data: DeletePostPayload,
    callback: (response: SocketResponse<{ postId: string }>) => void
  ) => void;

  /**
   * LIKE: Like a post
   * @param data - { postId: string }
   * @param callback - SocketResponse<PostResponse> - Returns the updated post
   * @broadcasts LIKED to all users
   */
  [POST_EVENTS.LIKE]: (
    data: LikePostPayload,
    callback: (response: SocketResponse<PostResponse>) => void
  ) => void;

  /**
   * UNLIKE: Remove a like from a post
   * @param data - { postId: string }
   * @param callback - SocketResponse<PostResponse> - Returns the updated post
   * @broadcasts UNLIKED to all users
   */
  [POST_EVENTS.UNLIKE]: (
    data: RemoveLikePayload,
    callback: (response: SocketResponse<PostResponse>) => void
  ) => void;

  /**
   * BOOKMARK: Bookmark a post
   * @param data - { postId: string }
   * @param callback - SocketResponse<PostResponse> - Returns the updated post
   * @broadcasts BOOKMARKED to the user only
   */
  [POST_EVENTS.BOOKMARK]: (
    data: BookmarkPostPayload,
    callback: (response: SocketResponse<PostResponse>) => void
  ) => void;

  /**
   * UNBOOKMARK: Remove a bookmark from a post
   * @param data - { postId: string }
   * @param callback - SocketResponse<PostResponse> - Returns the updated post
   * @broadcasts UNBOOKMARKED to the user only
   */
  [POST_EVENTS.UNBOOKMARK]: (
    data: RemoveBookmarkPayload,
    callback: (response: SocketResponse<PostResponse>) => void
  ) => void;

  /**
   * GET_FEED: Get recent posts for the main feed with pagination
   * @param data - { take?: number; offset?: number } - take: number of posts (default 4, max 20), offset: skip count (default 0)
   * @param callback - SocketResponse<PostResponse[]> - Returns array of recent posts with user info
   */
  [POST_EVENTS.GET_FEED]: (
    data: GetFeedPayload,
    callback: (response: SocketResponse<PostResponse[]>) => void
  ) => void;

  /**
   * GET_RECENT_POSTS: Get recent posts from the user's RecentPosts with pagination
   * @param data - { take?: number; offset?: number } - take: number of posts (default 5, max 20), offset: skip count (default 0)
   * @param callback - SocketResponse<PostResponse[]> - Returns array of recent posts with user info
   */
  [POST_EVENTS.GET_RECENT_POSTS]: (
    data: GetRecentPostsPayload,
    callback: (response: SocketResponse<PostResponse[]>) => void
  ) => void;

  /**
   * ADD_RECENT_POST: Add a post to the user's RecentPosts
   * @param data - { postId: string }
   * @param callback - SocketResponse<{ postId: string, userId: string }> - Returns post ID and user ID
   * @broadcasts RECENT_POST_ADDED to all users
   * @note This creates a permanent RecentPosts record - users cannot leave posts
   */
  [POST_EVENTS.RECENT_POST_ADD]: (
    data: JoinPostPayload,
    callback: (
      response: SocketResponse<{ postId: string; userId: string }>
    ) => void
  ) => void;

  // ============================================================================
  // USER EVENTS
  // ============================================================================

  /**
   * GET_PROFILES: Get user profiles by user IDs
   * @param data - { userIds: string[] } - Array of user IDs (max 100)
   * @param callback - SocketResponse<Profile[]> - Returns array of user profiles
   */
  [USER_EVENTS.GET_PROFILES]: (
    data: GetUserProfilesPayload,
    callback: (response: SocketResponse<Profile[]>) => void
  ) => void;

  /**
   * UPDATE_PROFILE: Update the current user's profile
   * @param data - UpdateUserProfilePayload - Profile fields to update
   * @param callback - SocketResponse<Profile> - Returns the updated profile
   * @broadcasts PROFILE_UPDATED to all users
   */
  [USER_EVENTS.UPDATE_PROFILE]: (
    data: UpdateUserProfilePayload,
    callback: (response: SocketResponse<Profile>) => void
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

  // ============================================================================
  // CHANNEL EVENTS
  // ============================================================================

  /**
   * JOINED: A user joined a channel socket room (for receiving broadcasts)
   * @emitted_to All users in the channel socket room (via channel:channelId room)
   * @param data - { channelId: string, userId: string }
   */
  [CHANNEL_EVENTS.JOINED]: (data: { channelId: string }) => void;

  /**
   * LEFT: A user left a channel socket room (stopped receiving broadcasts)
   * @emitted_to All users in the channel socket room (via channel:channelId room)
   * @param data - { channelId: string, userId: string }
   * @note This does not mean the user left the channel (ChannelUser record may still exist)
   */
  [CHANNEL_EVENTS.LEFT]: (data: { channelId: string }) => void;

  /**
   * MARKED_AS_READ: A channel was marked as read
   * @emitted_to The user who marked it as read (via user:userId room)
   * @param data - { channelId: string }
   */
  [CHANNEL_EVENTS.MARKED_AS_READ]: (data: { channelId: string }) => void;

  // ============================================================================
  // MESSAGE EVENTS
  // ============================================================================

  /**
   * CREATED: A new message was created in a channel
   * @emitted_to All users in the channel socket room (via channel:channelId room)
   * @param data - MessageData - The created message
   */
  [MESSAGE_EVENTS.CREATED]: (data: MessageData) => void;

  /**
   * EDITED: A message was edited in a channel
   * @emitted_to All users in the channel socket room (via channel:channelId room)
   * @param data - MessageData - The edited message
   */
  [MESSAGE_EVENTS.EDITED]: (data: MessageData) => void;

  /**
   * DELETED: A message was deleted from a channel
   * @emitted_to All users in the channel socket room (via channel:channelId room)
   * @param data - { messageId: string, channelId: string, channelType: "dm" | "post" }
   */
  [MESSAGE_EVENTS.DELETED]: (data: {
    messageId: string;
    channelId: string;
    channelType: "dm" | "post";
  }) => void;

  // ============================================================================
  // UPLOAD EVENTS
  // ============================================================================

  /**
   * INITIALISED: File upload was initialized
   * @emitted_to Client that initiated the upload (via user:userId room)
   * @param data - UploadInitialisedResponse - Contains attachment ID and presigned URL (attachment ID is used as key)
   */
  [UPLOAD_EVENTS.INITIALISED]: (data: UploadInitialisedResponse) => void;

  /**
   * COMPLETED: File upload was completed and verified
   * @emitted_to Client that completed the upload (via user:userId room)
   * @param data - UploadCompletedResponse - Contains attachment ID, URL, and status
   */
  [UPLOAD_EVENTS.COMPLETED]: (data: UploadCompletedResponse) => void;

  // ============================================================================
  // POST EVENTS
  // ============================================================================

  /**
   * CREATED: A new post was created
   * @emitted_to All users (posts are public)
   * @param data - PostResponse - The created post
   */
  [POST_EVENTS.CREATED]: (data: PostResponse) => void;

  /**
   * UPDATED: A post was updated
   * @emitted_to All users (posts are public)
   * @param data - PostResponse - The updated post
   */
  [POST_EVENTS.UPDATED]: (data: PostResponse) => void;

  /**
   * DELETED: A post was deleted
   * @emitted_to All users (posts are public)
   * @param data - { postId: string } - The deleted post ID
   */
  [POST_EVENTS.DELETED]: (data: { postId: string }) => void;

  /**
   * LIKED: A post was liked
   * @emitted_to All users (posts are public)
   * @param data - PostResponse - The updated post with new like count
   */
  [POST_EVENTS.LIKED]: (data: PostResponse) => void;

  /**
   * UNLIKED: A post was unliked
   * @emitted_to All users (posts are public)
   * @param data - PostResponse - The updated post with new like count
   */
  [POST_EVENTS.UNLIKED]: (data: PostResponse) => void;

  /**
   * BOOKMARKED: A post was bookmarked
   * @emitted_to The user who bookmarked only
   * @param data - PostResponse - The updated post
   */
  [POST_EVENTS.BOOKMARKED]: (data: PostResponse) => void;

  /**
   * UNBOOKMARKED: A post was unbookmarked
   * @emitted_to The user who unbookmarked only
   * @param data - PostResponse - The updated post
   */
  [POST_EVENTS.UNBOOKMARKED]: (data: PostResponse) => void;

  /**
   * RECENT_POST_ADDED: A post was added to the user's RecentPosts
   * @emitted_to All users (posts are public)
   * @param data - { postId: string, userId: string } - Post ID and user ID added to RecentPosts
   */
  [POST_EVENTS.RECENT_POST_ADDED]: (data: {
    postId: string;
    userId: string;
  }) => void;

  // ============================================================================
  // USER EVENTS
  // ============================================================================

  /**
   * PROFILE_UPDATED: A user profile was updated
   * @emitted_to All users who have this profile in their store (via user:userId room)
   * @param data - Profile - The updated profile
   */
  [USER_EVENTS.PROFILE_UPDATED]: (data: Profile) => void;
}
