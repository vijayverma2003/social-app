import {
  FriendRequests,
  IncomingAndOutgoingFriendRequests,
} from "@shared/types";
import { create } from "zustand";

interface FriendRequestsState {
  received: FriendRequests[];
  sent: FriendRequests[];
  isLoading: boolean;
  error: string | null;
  setInitialRequests: (requests: IncomingAndOutgoingFriendRequests) => void;
  addReceivedRequest: (request: FriendRequests) => void;
  addSentRequest: (request: FriendRequests) => void;
  removeRequestById: (requestId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFriendRequestsStore = create<FriendRequestsState>((set) => ({
  received: [],
  sent: [],
  isLoading: false,
  error: null,

  setInitialRequests: (requests) =>
    set({
      received: requests.incomingRequests ?? [],
      sent: requests.outgoingRequests ?? [],
      isLoading: false,
      error: null,
    }),

  addReceivedRequest: (request: FriendRequests) =>
    set((state) => ({
      received: [...state.received, request],
    })),

  addSentRequest: (request: FriendRequests) =>
    set((state) => ({
      sent: [...state.sent, request],
    })),

  removeRequestById: (requestId) =>
    set((state) => ({
      received: state.received.filter((r) => r.id !== requestId),
      sent: state.sent.filter((r) => r.id !== requestId),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}));
