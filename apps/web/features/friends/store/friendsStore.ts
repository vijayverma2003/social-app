import { type FriendsList } from "@shared/types/responses";
import { create } from "zustand";

interface FriendsState {
  friends: FriendsList[];
  isLoading: boolean;
  error: string | null;
  setFriends: (friends: FriendsList[]) => void;
  addFriend: (friend: FriendsList) => void;
  removeFriendById: (friendId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  isFriend: (friendId: string) => boolean;
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
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

  isFriend: (userId: string) => {
    console.log(get().friends);
    return get().friends.some((f) => f.userId === userId)
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}));
