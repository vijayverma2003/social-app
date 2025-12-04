import {
  type FriendsList,
  type IncomingAndOutgoingFriendRequests,
} from "@shared/types/responses";
import api from "./api";

export async function getFriendRequests(token?: string) {
  return await api.get<IncomingAndOutgoingFriendRequests>("/friends/requests", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function getFriends(token?: string) {
  return await api.get<FriendsList[]>("/friends", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
