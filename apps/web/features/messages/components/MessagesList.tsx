"use client";

import { MessageData } from "@shared/schemas/messages";
import MessagePreview from "../../../app/(user)/channels/components/MessagePreview";
import type { Virtualizer } from "@tanstack/react-virtual";
import { useRef, useMemo, useEffect } from "react";
import { VirtualList } from "@/features/posts/components/VirtualList";
import { useUser } from "@/providers/UserContextProvider";
import { Skeleton } from "@/components/ui/skeleton";

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
  isLoading?: boolean;
  skeletonCount?: number;
  /** Optional message ID to scroll to on initial render (e.g. for message links) */
  initialScrollToMessageId?: string;
  /** Virtualizer instance, created by the parent channel component */
  virtualizer: Virtualizer<HTMLElement, Element>;
}

export const MessagesList = ({
  messages,
  emptyMessage = "No messages yet :(",
  className = "",
  onEditMessage,
  onReplyMessage,
  containerRef,
  isLoading = false,
  skeletonCount = 10,
  initialScrollToMessageId,
  virtualizer,
}: MessagesListProps) => {
  const { user } = useUser();
  const parentRef = useRef<HTMLDivElement>(null);
  const scrollElement = containerRef || parentRef;

  // Scroll to a specific message on initial render (for message links / aroundMessageId)
  const hasScrolledToInitialRef = useRef(false);

  // Reset the scroll flag whenever the target message ID changes
  useEffect(() => {
    hasScrolledToInitialRef.current = false;
  }, [initialScrollToMessageId]);

  useEffect(() => {
    if (!initialScrollToMessageId || hasScrolledToInitialRef.current) return;
    if (!messages.length) return;

    const index = messages.findIndex((m) => m.id === initialScrollToMessageId);
    if (index >= 0) {
      // Defer scrolling to the next animation frame so that
      // all virtualized rows have been rendered and measured.
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(index, {
          align: "center",
          behavior: "auto",
        });
        setTimeout(() => {
          hasScrolledToInitialRef.current = true;
        }, 100)
      });
    }
  }, [initialScrollToMessageId, messages, virtualizer]);

  // Create a map of message IDs to messages for quick lookup
  const messagesMap = useMemo(() => {
    const map = new Map<string, MessageData>();
    messages.forEach((m) => {
      map.set(m.id, m);
    });
    return map;
  }, [messages]);

  // Loading state with skeletons
  if (isLoading || (initialScrollToMessageId && !hasScrolledToInitialRef.current)) {
    return (
      <div
        ref={parentRef}
        className={`flex flex-col space-y-3 ${className}`}
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div key={"message-skeleton-" + index} className="flex items-start gap-4 px-4 space-y-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

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
              key={message.id}
              message={message}
              lastMessage={lastMessage}
              onEdit={onEditMessage}
              onReply={onReplyMessage}
              repliedToMessage={repliedToMessage}
              highlight={highlight}
            />
          );
        }}
        itemSpacing={1}
      />
    </div>
  );
};
