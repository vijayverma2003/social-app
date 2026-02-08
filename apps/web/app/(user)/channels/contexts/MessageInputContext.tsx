"use client";

import type { OptimistcMessageData } from "@/stores/messagesStore";
import type { Attachment } from "@shared/schemas/messages";
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
  startEditing: (
    messageId: string,
    messageContent: string,
    attachments?: Attachment[],
  ) => void;
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

  const startEditing = useCallback(
    (
      messageId: string,
      messageContent: string,
      attachments?: Attachment[],
    ) => {
      messageInputRef.current?.startEditing(
        messageId,
        messageContent,
        attachments,
      );
    },
    [messageInputRef],
  );

  const value = useMemo<MessageInputContextValue>(
    () => ({ startReply, startEditing }),
    [startReply, startEditing],
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
