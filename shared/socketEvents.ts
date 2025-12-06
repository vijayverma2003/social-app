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
  REMOVE: "friends:remove",
  REMOVED: "friends:removed",
} as const;

export const DM_EVENTS = {
  // Client -> Server events (actions)
  GET_LIST: "dm:get_list",
  JOIN: "dm:join",
  LEAVE: "dm:leave",

  // Server -> Client events (notifications)
  JOINED: "dm:joined",
  LEFT: "dm:left",
} as const;

export const MESSAGE_EVENTS = {
  // Client -> Server events (actions)
  CREATE: "message:create",
  GET: "message:get",

  // Server -> Client events (notifications)
  CREATED: "message:created",
} as const;

export type FriendRequestEvent =
  (typeof FRIEND_REQUEST_EVENTS)[keyof typeof FRIEND_REQUEST_EVENTS];

export type FriendEvent = (typeof FRIEND_EVENTS)[keyof typeof FRIEND_EVENTS];

export type DMEvent = (typeof DM_EVENTS)[keyof typeof DM_EVENTS];

export type MessageEvent = (typeof MESSAGE_EVENTS)[keyof typeof MESSAGE_EVENTS];
