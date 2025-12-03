import { FriendRequest } from "@database/postgres/generated/prisma/client";
import {
  FriendRequestsListResponse,
  IncomingAndOutgoingFriendRequestsResponse,
} from "@shared/types";
import { create } from "zustand";

interface FriendRequestsState {
  received: FriendRequestsListResponse[];
  sent: FriendRequestsListResponse[];
  isLoading: boolean;
  error: string | null;
  setInitialRequests: (
    requests: IncomingAndOutgoingFriendRequestsResponse
  ) => void;
  addReceivedRequest: (request: FriendRequestsListResponse) => void;
  addSentRequest: (request: FriendRequestsListResponse) => void;
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

  addReceivedRequest: (request: FriendRequestsListResponse) =>
    set((state) => ({
      received: [...state.received, request],
    })),

  addSentRequest: (request: FriendRequestsListResponse) =>
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
