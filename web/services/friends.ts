import api from "./api";

interface FriendRequest {
  _id: string;
  senderId: string;
  receiverId: string;
  createdAt: Date;
}

interface FriendRequestsResponse {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
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
};
