"use client";

import type { OptimistcMessageData } from "@/stores/messagesStore";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type RefObject,
} from "react";
import type { MessageInputRef } from "../components/MessageInput";

interface MessageInputContextValue {
  startReply: (message: OptimistcMessageData) => void;
}

const MessageInputContext = createContext<MessageInputContextValue | null>(
  null,
);

interface MessageInputProviderProps {
  messageInputRef: RefObject<MessageInputRef | null>;
  children: React.ReactNode;
}

export function MessageInputProvider({
  messageInputRef,
  children,
}: MessageInputProviderProps) {
  const startReply = useCallback(
    (message: OptimistcMessageData) => {
      messageInputRef.current?.startReply(message);
    },
    [messageInputRef],
  );

  const value = useMemo<MessageInputContextValue>(
    () => ({ startReply }),
    [startReply],
  );

  return (
    <MessageInputContext.Provider value={value}>
      {children}
    </MessageInputContext.Provider>
  );
}

export function useMessageInput(): MessageInputContextValue | null {
  return useContext(MessageInputContext);
}
