"use client";

import { Profile } from "@shared/types/responses";
import { create } from "zustand";

interface ProfilesState {
  // User ID -> UserWithProfile
  profiles: Record<string, Profile>;
  addProfile: (userId: string, profile: Profile) => void;
  addProfiles: (profiles: Profile[]) => void;
  updateProfile: (profile: Profile) => void;
  getProfile: (userId: string) => Profile | undefined;
  getProfiles: (userIds: string[]) => Profile[];
}

export const useProfilesStore = create<ProfilesState>((set, get) => ({
  profiles: {},

  addProfile: (userId, profile) =>
    set((state) => ({
      profiles: {
        ...state.profiles,
        [userId]: profile,
      },
    })),

  addProfiles: (profiles) =>
    set((state) => {
      const profilesMap: Record<string, Profile> = {};
      profiles.forEach((profile) => {
        profilesMap[profile.userId] = profile;
      });
      return {
        profiles: { ...state.profiles, ...profilesMap },
      };
    }),

  updateProfile: (profile) =>
    set((state) => {
      if (!state.profiles[profile.userId]) return state;
      return {
        profiles: {
          ...state.profiles,
          [profile.userId]: profile,
        },
      };
    }),

  getProfile: (userId) => {
    return get().profiles[userId];
  },

  getProfiles: (userIds) => {
    const state = get();
    return userIds
      .map((userId) => state.profiles[userId])
      .filter((profile): profile is Profile => profile !== undefined);
  },
}));
