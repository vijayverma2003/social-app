import api from "./api";

export interface FriendRequest {
  _id: string;
  senderId: string;
  receiverId: string;
  createdAt: Date;
  senderUsername?: string;
  senderAvatarURL?: string;
  senderDisplayName?: string;
  receiverUsername?: string;
  receiverAvatarURL?: string;
  receiverDisplayName?: string;
}

export interface FriendProfile {
  _id: string;
  userId: string;
  friendId: string;
  createdAt: string;
  profile: {
    _id: string;
    username?: string;
    discriminator?: string;
    avatarURL?: string;
    bannerURL?: string;
    bannerColor?: string;
    bio?: string;
    pronouns?: string;
  } | null;
}

interface FriendRequestsResponse {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

interface FriendsResponse {
  friends: FriendProfile[];
}

export const friendsService = {
  async getFriendRequests(token?: string): Promise<FriendRequestsResponse> {
    const response = await api.get<FriendRequestsResponse>(
      "/friends/requests",
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    return response.data;
  },

  async getFriends(token?: string): Promise<FriendsResponse> {
    const response = await api.get<FriendsResponse>("/friends", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  },
};
