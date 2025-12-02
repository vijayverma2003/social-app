import {
  FriendsListResponse,
  IncomingAndOutgoingFriendRequestsResponse,
} from "@shared/types";
import api from "./api";

export async function getFriendRequests(token?: string) {
  return await api.get<IncomingAndOutgoingFriendRequestsResponse>(
    "/friends/requests",
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
}

export async function getFriends(token?: string) {
  return await api.get<FriendsListResponse[]>("/friends", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
