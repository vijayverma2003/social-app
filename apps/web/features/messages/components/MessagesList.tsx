"use client";

import { MessageData } from "@shared/schemas/messages";
import MessagePreview from "./MessagePreview";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import { VirtualList } from "@/features/posts/components/VirtualList";

interface MessagesListProps {
  messages: MessageData[];
  emptyMessage?: string;
  className?: string;
  onEditMessage?: (
    messageId: string,
    messageContent: string,
    attachments?: MessageData["attachments"]
  ) => void;
  containerRef?: React.RefObject<HTMLElement | null>;
}

export const MessagesList = ({
  messages,
  emptyMessage = "No messages yet :(",
  className = "",
  onEditMessage,
  containerRef,
}: MessagesListProps) => {
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
          return (
            <MessagePreview
              message={message}
              lastMessage={lastMessage}
              onEdit={onEditMessage}
            />
          );
        }}
        itemSpacing={4}
      />
    </div>
  );
};
