import {
  User,
  Profile,
  FriendRequest,
  Friend,
  DMChannel,
  DMChannelUser,
} from "@database/postgres/generated/prisma/client";

// Public user type - only includes safe fields (username, discriminator, id)
export type PublicUserResponse = {
  id: string;
  username: string;
  discriminator: string;
};

// Legacy UserResponse - keeping for backward compatibility but should be replaced
export type UserResponse = User;
export type ProfileResponse = Profile;
export type FriendRequestResponse = FriendRequest;

export type UserWithProfileResponse = PublicUserResponse & {
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

export type DMChannelUserResponse = DMChannelUser & {
  user: PublicUserResponse & {
    profile: Profile | null;
  };
};

export type DMChannelResponse = DMChannel & {
  users: DMChannelUserResponse[];
};

export type DMChannelsListResponse = DMChannelResponse[];
