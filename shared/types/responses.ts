import {
  User as PrismaUser,
  Profile as PrismaProfile,
  FriendRequest as PrismaFriendRequest,
  Friend as PrismaFriend,
  DMChannel as PrismaDMChannel,
  DMChannelUser as PrismaDMChannelUser,
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
export type DMChannel = PrismaDMChannel;
export type DMChannelUser = PrismaDMChannelUser;

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
  username: string;
  discriminator: string;
  dmChannelId: string;
  profile: Profile | null;
};

export type FriendRequests = {
  id: string;
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
// DM RELATED TYPES
// ============================================================================

export type DMChannelUserWithProfile = DMChannelUser & {
  user: PublicUser & {
    profile: Profile | null;
  };
};

export type DMChannelWithUsers = DMChannel & {
  users: DMChannelUserWithProfile[];
};
