import { FriendsListResponse } from "@shared/types/responses";
import { create } from "zustand";

interface FriendsState {
  friends: FriendsListResponse[];
  isLoading: boolean;
  error: string | null;
  setFriends: (friends: FriendsListResponse[]) => void;
  addFriend: (friend: FriendsListResponse) => void;
  removeFriendById: (friendId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFriendsStore = create<FriendsState>((set) => ({
  friends: [],
  isLoading: false,
  error: null,

  setFriends: (friends) =>
    set({
      friends: friends ?? [],
      isLoading: false,
      error: null,
    }),

  addFriend: (friend) =>
    set((state) => {
      if (state.friends.some((f) => f.id === friend.id)) return state;
      return { friends: [...state.friends, friend] };
    }),

  removeFriendById: (friendId) =>
    set((state) => ({
      friends: state.friends.filter((f) => f.id !== friendId),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}));
