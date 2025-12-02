import {
  User,
  Profile,
  FriendRequest,
  Friend,
} from "@database/postgres/generated/prisma/client";

export type UserResponse = User;
export type ProfileResponse = Profile;
export type FriendRequestResponse = FriendRequest;

export type UserWithProfileResponse = UserResponse & {
  profile: Profile | null;
};

export type FriendsListResponse = {
  id: string;
  username: string;
  discriminator: string;
  dmChannelId: string;
  profile: Profile | null;
};

export type FriendRequestsListResponse = {
  id: string;
  username: string;
  discriminator: string;
  profile: Profile | null;
  createdAt: Date;
};

export type IncomingAndOutgoingFriendRequestsResponse = {
  incomingRequests: FriendRequestsListResponse[];
  outgoingRequests: FriendRequestsListResponse[];
};

export type SocketResponse<T> = {
  data?: T;
  success?: boolean;
  error?: string;
};
