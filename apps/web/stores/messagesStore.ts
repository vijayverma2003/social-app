import { MessageData } from "@shared/schemas/messages";
import { create } from "zustand";

export interface OptimistcMessageData extends MessageData {
  id: string;
  error?: string;
  uploadingFiles?: Array<{ id: string; name: string; size: number }>;
}

interface MessagesState {
  // Channel ID -> Messages array
  messagesByChannel: Record<string, MessageData[]>;
  isLoading: boolean;
  error: string | null;
  pendingEditRequests: number;
  setMessages: (channelId: string, messages: MessageData[]) => void;
  addMessage: (channelId: string, message: MessageData) => void;
  addOptimisticMessage: (
    channelId: string,
    message: OptimistcMessageData
  ) => string; // Returns the optimistic message ID
  replaceOptimisticMessage: (
    channelId: string,
    optimisticId: string,
    realMessage: MessageData
  ) => void;
  markMessageAsError: (
    channelId: string,
    messageId: string,
    error: string
  ) => void;
  prependMessages: (channelId: string, messages: MessageData[]) => void;
  appendMessages: (channelId: string, messages: MessageData[]) => void;
  updateMessage: (
    channelId: string,
    messageId: string,
    updates: Partial<MessageData>
  ) => void;
  removeMessage: (channelId: string, messageId: string) => void;
  clearChannel: (channelId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  incrementPendingEditRequests: () => void;
  decrementPendingEditRequests: () => void;
}

export const useMessagesStore = create<MessagesState>((set) => ({
  messagesByChannel: {},
  isLoading: false,
  error: null,
  pendingEditRequests: 0,

  setMessages: (channelId, messages) =>
    set((state) => ({
      messagesByChannel: {
        ...state.messagesByChannel,
        [channelId]: messages,
      },
      isLoading: false,
      error: null,
    })),

  addMessage: (channelId, message) =>
    set((state) => {
      const existingMessages = state.messagesByChannel[channelId] || [];
      // Check if message already exists (avoid duplicates)
      if (existingMessages.some((m) => m.id === message.id)) {
        return state;
      }
      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: [...existingMessages, message],
        },
      };
    }),

  addOptimisticMessage: (channelId, message) => {
    const optimisticId = `optimistic-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 10)}`;

    const optimisticMessage: MessageData & {
      error?: string;
      uploadingFiles?: Array<{ id: string; name: string; size: number }>;
    } = {
      ...message,
      id: optimisticId,
      error: message.error,
      uploadingFiles: message.uploadingFiles,
    };

    set((state) => {
      const existingMessages = state.messagesByChannel[channelId] || [];
      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: [...existingMessages, optimisticMessage],
        },
      };
    });

    return optimisticId;
  },

  markMessageAsError: (channelId, messageId, error) =>
    set((state) => {
      const messages = state.messagesByChannel[channelId] || [];
      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: messages.map((message) =>
            message.id === messageId
              ? ({ ...message, error } as MessageData & { error?: string })
              : message
          ),
        },
      };
    }),

  replaceOptimisticMessage: (channelId, optimisticId, realMessage) =>
    set((state) => {
      const messages = state.messagesByChannel[channelId] || [];
      const messageIndex = messages.findIndex((m) => m.id === optimisticId);

      if (messageIndex === -1) {
        // Optimistic message not found, just add the real message
        return {
          messagesByChannel: {
            ...state.messagesByChannel,
            [channelId]: [...messages, realMessage],
          },
        };
      }

      // Replace optimistic message with real one
      const newMessages = [...messages];
      newMessages[messageIndex] = realMessage;

      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: newMessages,
        },
      };
    }),

  prependMessages: (channelId, messages) =>
    set((state) => {
      const existingMessages = state.messagesByChannel[channelId] || [];
      const newMessageIds = new Set(messages.map((m) => m.id));
      const filteredExisting = existingMessages.filter(
        (m) => !newMessageIds.has(m.id)
      );
      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: [...messages, ...filteredExisting],
        },
      };
    }),

  appendMessages: (channelId, messages) =>
    set((state) => {
      const existingMessages = state.messagesByChannel[channelId] || [];
      const newMessageIds = new Set(messages.map((m) => m.id));
      const filteredExisting = existingMessages.filter(
        (m) => !newMessageIds.has(m.id)
      );
      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: [...filteredExisting, ...messages],
        },
      };
    }),

  updateMessage: (channelId, messageId, updates) =>
    set((state) => {
      const messages = state.messagesByChannel[channelId] || [];
      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: messages.map((message) =>
            message.id === messageId ? { ...message, ...updates } : message
          ),
        },
      };
    }),

  removeMessage: (channelId, messageId) =>
    set((state) => {
      const messages = state.messagesByChannel[channelId] || [];
      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: messages.filter((message) => message.id !== messageId),
        },
      };
    }),

  clearChannel: (channelId) =>
    set((state) => {
      const { [channelId]: _, ...rest } = state.messagesByChannel;
      return {
        messagesByChannel: rest,
      };
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  incrementPendingEditRequests: () =>
    set((state) => ({
      pendingEditRequests: state.pendingEditRequests + 1,
    })),

  decrementPendingEditRequests: () =>
    set((state) => ({
      pendingEditRequests: Math.max(0, state.pendingEditRequests - 1),
    })),
}));
