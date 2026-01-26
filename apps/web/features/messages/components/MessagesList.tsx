"use client";

import { MessageData } from "@shared/schemas/messages";
import MessagePreview from "./MessagePreview";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useMemo } from "react";
import { VirtualList } from "@/features/posts/components/VirtualList";
import { useUser } from "@/providers/UserContextProvider";

interface MessagesListProps {
  messages: MessageData[];
  emptyMessage?: string;
  className?: string;
  onEditMessage?: (
    messageId: string,
    messageContent: string,
    attachments?: MessageData["attachments"]
  ) => void;
  onReplyMessage?: (message: MessageData) => void;
  containerRef?: React.RefObject<HTMLElement | null>;
}

export const MessagesList = ({
  messages,
  emptyMessage = "No messages yet :(",
  className = "",
  onEditMessage,
  onReplyMessage,
  containerRef,
}: MessagesListProps) => {
  const { user } = useUser();
  const parentRef = useRef<HTMLDivElement>(null);
  const scrollElement = containerRef || parentRef;

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollElement.current,
    estimateSize: () => 80, // Estimated height per message
    overscan: 5,
    enabled: messages.length > 0,
    measureElement:
      typeof window !== "undefined" && navigator.userAgent.indexOf("Firefox") === -1
        ? (element: Element | null) => element?.getBoundingClientRect().height ?? 80
        : undefined,
  });

  // Create a map of message IDs to messages for quick lookup
  const messagesMap = useMemo(() => {
    const map = new Map<string, MessageData>();
    messages.forEach((m) => {
      map.set(m.id, m);
    });
    return map;
  }, [messages]);

  // Compute set of message IDs that are replies (for highlighting)
  const replyMessageIds = useMemo(() => {
    const ids = new Set<string>();
    messages.forEach((m) => {
      if (m.replyToMessageId) ids.add(m.id);
    });
    return ids;
  }, [messages]);

  if (messages.length === 0) {
    return (
      <p className="text-muted-foreground text-xs text-center py-8">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div ref={parentRef} className={`flex flex-col ${className}`}>
      <VirtualList
        virtualizer={virtualizer as unknown as import("@tanstack/react-virtual").Virtualizer<HTMLElement, Element>}
        items={messages}
        renderItem={(message, index) => {
          const lastMessage = index > 0 ? messages[index - 1] : null;
          const repliedToMessage = message.replyToMessageId
            ? messagesMap.get(message.replyToMessageId) || null
            : null;

          const highlight = repliedToMessage ? repliedToMessage.authorId === user?.id : false;
          return (
              <MessagePreview
                message={message}
                lastMessage={lastMessage}
                onEdit={onEditMessage}
                onReply={onReplyMessage}
                repliedToMessage={repliedToMessage}
                highlight={highlight}
              />
          );
        }}
        itemSpacing={4}
      />
    </div>
  );
};
