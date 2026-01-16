import {
  type FriendsList,
  type IncomingAndOutgoingFriendRequests,
} from "@shared/types/responses";
import api from "@/services/apiService";
import { FRIEND_EVENTS } from "@shared/socketEvents";
import { socketService } from "@/services/socketService";
import { ServiceOptions } from "@/services/socketService";

export async function getFriendRequests(token?: string) {
  return await api.get<IncomingAndOutgoingFriendRequests>("/friends/requests", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export function getFriends(
  options?: ServiceOptions<FriendsList[]>
): Promise<FriendsList[]> {
  return socketService.emitWithResponse<
    typeof FRIEND_EVENTS.GET_LIST,
    FriendsList[]
  >({
    event: FRIEND_EVENTS.GET_LIST,
    payload: {},
    defaultErrorMessage: "Failed to get friends",
    options,
  });
}
