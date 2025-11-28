import { create } from "zustand";
import type { FriendRequest } from "@/services/friends";

interface FriendRequestsState {
  received: FriendRequest[];
  sent: FriendRequest[];
  isLoading: boolean;
  error: string | null;
  setInitialRequests: (
    incoming: FriendRequest[],
    outgoing: FriendRequest[]
  ) => void;
  addReceivedRequest: (request: FriendRequest) => void;
  addSentRequest: (request: FriendRequest) => void;
  removeRequestById: (requestId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFriendRequestsStore = create<FriendRequestsState>((set) => ({
  received: [],
  sent: [],
  isLoading: false,
  error: null,

  setInitialRequests: (incoming, outgoing) =>
    set({
      received: incoming,
      sent: outgoing,
      isLoading: false,
      error: null,
    }),

  addReceivedRequest: (request) =>
    set((state) => ({
      received: [...state.received, request],
    })),

  addSentRequest: (request) =>
    set((state) => ({
      sent: [...state.sent, request],
    })),

  removeRequestById: (requestId) =>
    set((state) => ({
      received: state.received.filter((r) => r._id !== requestId),
      sent: state.sent.filter((r) => r._id !== requestId),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}));
