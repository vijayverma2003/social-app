import api from "./api";
import {
  Profile,
  FriendRequest,
} from "@database/postgres/generated/prisma/client";

export interface Friends {
  id: string;
  username: string;
  discriminator: string;
  dmChannelId: string;
  profile: Profile;
}

export async function getFriendRequests(token?: string) {
  return await api.get<{
    incomingRequests: FriendRequest[];
    outgoingRequests: FriendRequest[];
  }>("/friends/requests", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function getFriends(token?: string) {
  return await api.get<Friends[]>("/friends", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
