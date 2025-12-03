export const FRIEND_REQUEST_EVENTS = {
  // Client -> Server events (actions)
  SEND: "friend_request:send",
  ACCEPT: "friend_request:accept",
  REJECT: "friend_request:reject",

  // Server -> Client events (notifications)
  RECEIVED: "friend_request:received",
  ACCEPTED: "friend_request:accepted",
  REJECTED: "friend_request:rejected",
} as const;

export const FRIEND_EVENTS = {
  REMOVE: "friends:remove",
  REMOVED: "friends:removed",
} as const;

export type FriendRequestEvent =
  (typeof FRIEND_REQUEST_EVENTS)[keyof typeof FRIEND_REQUEST_EVENTS];

export type FriendEvent = (typeof FRIEND_EVENTS)[keyof typeof FRIEND_EVENTS];