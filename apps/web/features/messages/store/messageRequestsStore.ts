import { create } from "zustand";

export type MessageRequest = {
  id: string;
  senderId: string;
  receiverId: string;
  channelId: string;
  createdAt: string;
};

interface MessageRequestsState {
  requests: MessageRequest[];
  addRequest: (request: MessageRequest) => void;
  removeRequestById: (id: string) => void;
  clearRequests: () => void;
}

export const useMessageRequestsStore = create<MessageRequestsState>((set) => ({
  requests: [],

  addRequest: (request) =>
    set((state) => {
      if (state.requests.some((r) => r.id === request.id)) {
        return state;
      }
      return { requests: [...state.requests, request] };
    }),

  removeRequestById: (id) =>
    set((state) => ({
      requests: state.requests.filter((r) => r.id !== id),
    })),

  clearRequests: () => set({ requests: [] }),
}));

