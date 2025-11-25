// Friend request schemas and types
export {
  FriendRequestSchema,
  CreateFriendRequestSchema,
  type FriendRequestData,
  type CreateFriendRequestData,
} from "./schemas/friends";

// WebSocket event names
export { FRIEND_REQUEST_EVENTS, type FriendRequestEvent } from "./socketEvents";
