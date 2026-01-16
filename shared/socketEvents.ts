export const FRIEND_REQUEST_EVENTS = {
  // Client -> Server events (actions)
  SEND: "friend_request:send",
  ACCEPT: "friend_request:accept",
  REJECT: "friend_request:reject",
  CANCEL: "friend_request:cancel",

  // Server -> Client events (notifications)
  RECEIVED: "friend_request:received",
  ACCEPTED: "friend_request:accepted",
  REJECTED: "friend_request:rejected",
  CANCELED: "friend_request:canceled",
} as const;

export const FRIEND_EVENTS = {
  GET_LIST: "friends:get_list",
  REMOVE: "friends:remove",
  REMOVED: "friends:removed",
} as const;

export const CHANNEL_EVENTS = {
  // Client -> Server events (actions)
  GET_DMS_LIST: "channel:get_dms_list",
  GET_POSTS_LIST: "channel:get_posts_list",
  JOIN: "channel:join",
  LEAVE: "channel:leave",
  MARK_AS_READ: "channel:mark_as_read",

  // Server -> Client events (notifications)
  JOINED: "channel:joined",
  LEFT: "channel:left",
  MARKED_AS_READ: "channel:marked_as_read",
} as const;

export const MESSAGE_EVENTS = {
  // Client -> Server events (actions)
  CREATE: "message:create",
  GET: "message:get",
  EDIT: "message:edit",
  DELETE: "message:delete",

  // Server -> Client events (notifications)
  CREATED: "message:created",
  EDITED: "message:edited",
  DELETED: "message:deleted",
} as const;

export const UPLOAD_EVENTS = {
  // Client -> Server events (actions)
  INIT: "upload:init",
  COMPLETE: "upload:complete",

  // Server -> Client events (notifications)
  INITIALISED: "upload:initialised",
  COMPLETED: "upload:completed",
} as const;

export const POST_EVENTS = {
  // Client -> Server events (actions)
  CREATE: "post:create",
  UPDATE: "post:update",
  DELETE: "post:delete",
  LIKE: "post:like",
  UNLIKE: "post:unlike",
  BOOKMARK: "post:bookmark",
  UNBOOKMARK: "post:unbookmark",
  GET_FEED: "post:get_feed",
  GET_RECENT_POSTS: "post:get_recent_posts",
  RECENT_POST_ADD: "post:recent_post_add",

  // Server -> Client events (notifications)
  CREATED: "post:created",
  UPDATED: "post:updated",
  DELETED: "post:deleted",
  LIKED: "post:liked",
  UNLIKED: "post:unliked",
  BOOKMARKED: "post:bookmarked",
  UNBOOKMARKED: "post:unbookmarked",
  RECENT_POST_ADDED: "post:recent_post_added",
} as const;

export const USER_EVENTS = {
  // Client -> Server events (actions)
  GET_PROFILES: "user:get_profiles",
  UPDATE_PROFILE: "user:update_profile",

  // Server -> Client events (notifications)
  PROFILE_UPDATED: "user:profile_updated",
} as const;

export type FriendRequestEvent =
  (typeof FRIEND_REQUEST_EVENTS)[keyof typeof FRIEND_REQUEST_EVENTS];

export type FriendEvent = (typeof FRIEND_EVENTS)[keyof typeof FRIEND_EVENTS];

export type ChannelEvent = (typeof CHANNEL_EVENTS)[keyof typeof CHANNEL_EVENTS];

export type MessageEvent = (typeof MESSAGE_EVENTS)[keyof typeof MESSAGE_EVENTS];

export type UploadEvent = (typeof UPLOAD_EVENTS)[keyof typeof UPLOAD_EVENTS];

export type PostEvent = (typeof POST_EVENTS)[keyof typeof POST_EVENTS];

export type UserEvent = (typeof USER_EVENTS)[keyof typeof USER_EVENTS];
