"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ConversationPreviewState = {
  channelId: string | null;
  postId: string | null;
  title: string;
  isOpen: boolean;
};

type OpenConversationArgs = {
  channelId: string;
  postId?: string;
  title?: string;
};

type ConversationPreviewContextType = {
  state: ConversationPreviewState;
  openConversation: (args: OpenConversationArgs) => void;
  closeConversation: () => void;
};

const ConversationPreviewContext = createContext<
  ConversationPreviewContextType | undefined
>(undefined);

const initialState: ConversationPreviewState = {
  channelId: null,
  postId: null,
  title: "",
  isOpen: false,
};

export const ConversationPreviewProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, setState] = useState<ConversationPreviewState>(initialState);

  const openConversation = useCallback((args: OpenConversationArgs) => {
    setState({
      channelId: args.channelId,
      postId: args.postId ?? null,
      title: args.title ?? "",
      isOpen: true,
    });
  }, []);

  const closeConversation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  return (
    <ConversationPreviewContext.Provider
      value={{
        state,
        openConversation,
        closeConversation,
      }}
    >
      {children}
    </ConversationPreviewContext.Provider>
  );
};

export const useConversationPreview = () => {
  const ctx = useContext(ConversationPreviewContext);
  if (!ctx) {
    throw new Error(
      "useConversationPreview must be used within a ConversationPreviewProvider",
    );
  }
  return ctx;
};

