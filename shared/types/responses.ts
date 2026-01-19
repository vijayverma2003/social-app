import {
  User as PrismaUser,
  Profile as PrismaProfile,
  FriendRequest as PrismaFriendRequest,
  Friend as PrismaFriend,
  Channel as PrismaChannel,
  ChannelUser as PrismaChannelUser,
} from "@database/postgres/generated/prisma/client";

export type SocketResponse<T> = {
  data?: T;
  success?: boolean;
  error?: string;
};

export type User = PrismaUser;
export type Profile = PrismaProfile;
export type Friend = PrismaFriend;
export type FriendRequest = PrismaFriendRequest;
export type Channel = PrismaChannel;
export type ChannelUser = PrismaChannelUser;

// ============================================================================
// USER RELATED TYPES
// ============================================================================

// Public user type - only includes safe fields (username, discriminator, id)
export type PublicUser = {
  id: string;
  username: string;
  discriminator: string;
};

// Legacy UserResponse - keeping for backward compatibility but should be replaced

export type UserWithProfile = PublicUser & {
  profile: Profile | null;
};

// ============================================================================
// FRIEND RELATED TYPES
// ============================================================================

export type FriendsList = {
  id: string;
  userId: string;
  username: string;
  discriminator: string;
  channelId: string | null;
  profile: Profile | null;
};

export type FriendRequests = {
  id: string;
  /**
   * The other user's id involved in the request (sender for incoming, receiver for outgoing)
   */
  userId: string;
  username: string;
  discriminator: string;
  profile: Profile | null;
  createdAt: Date;
};

export type IncomingAndOutgoingFriendRequests = {
  incomingRequests: FriendRequests[];
  outgoingRequests: FriendRequests[];
};

// ============================================================================
// CHANNEL RELATED TYPES
// ============================================================================

export type ChannelWithUsers = Channel & { users: ChannelUser[] };
