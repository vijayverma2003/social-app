"use client";

import { InfiniteScroll } from "@/features/messages/components/InfiniteScroll";
import {
  MessageInput,
  MessageInputRef,
} from "@/features/messages/components/MessageInput";
import { MessagesList } from "@/features/messages/components/MessagesList";
import { useMessagesBootstrap } from "@/features/messages/hooks/useMessagesBootstrap";
import { useMessagesStore } from "@/features/messages/store/messagesStore";
import { useUser } from "@/providers/UserContextProvider";
import {
  markChannelAsRead,
  startListeningChannelEvents,
  stopListeningChannelEvents,
} from "@/services/channelService";
import { fetchMessages } from "@/services/messagesService";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";

interface PostChannelProps {
  channelId: string;
}

export const PostChannel = ({ channelId }: PostChannelProps) => {
  const { user: currentUser } = useUser();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<MessageInputRef>(null);
  const hasMarkedAsReadRef = useRef(false);

  const messagesSelector = useMemo(
    () => (state: ReturnType<typeof useMessagesStore.getState>) =>
      channelId ? state.messagesByChannel[channelId] || [] : [],
    [channelId]
  );

  const messages = useMessagesStore(useShallow(messagesSelector));
  const previousMessagesLengthRef = useRef(0);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [hasMoreOlderMessages, setHasMoreOlderMessages] = useState(true);
  const isLoadingOlderMessagesRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (!messagesContainerRef.current) return;

    messagesContainerRef.current.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  // Bootstrap messages
  useMessagesBootstrap(channelId, "post", scrollToBottom, scrollToBottom);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    const currentLength = messages.length;
    const previousLength = previousMessagesLengthRef.current;

    // Only auto-scroll to bottom if new messages were added at the end (not from infinite scroll)
    // We detect this by checking if the scroll is near the bottom
    if (currentLength > previousLength && currentLength > 0) {
      const container = messagesContainerRef.current;
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isNearBottom =
          Math.abs(scrollHeight - scrollTop - clientHeight) < 100;
        // Only auto-scroll if user is near bottom (new message, not loading history)
        if (isNearBottom) {
          setTimeout(scrollToBottom, 0);
        }
      }
    }

    previousMessagesLengthRef.current = currentLength;
  }, [messages.length, scrollToBottom]);

  // Listen to channel events
  useEffect(() => {
    if (!channelId) return;
    startListeningChannelEvents({ channelId });
    hasMarkedAsReadRef.current = false;

    return () => {
      stopListeningChannelEvents({ channelId });
    };
  }, [channelId]);

  // Load older messages when scrolling up
  const loadOlderMessages = useCallback(async () => {
    if (
      !channelId ||
      isLoadingOlderMessagesRef.current ||
      !hasMoreOlderMessages
    ) {
      return;
    }

    const oldestMessage = messages[0];
    if (!oldestMessage) return;

    isLoadingOlderMessagesRef.current = true;
    setIsLoadingOlderMessages(true);

    const container = messagesContainerRef.current;
    const previousScrollHeight = container?.scrollHeight || 0;

    try {
      // Handle createdAt as either Date object or string
      const createdAtDate =
        oldestMessage.createdAt instanceof Date
          ? oldestMessage.createdAt
          : new Date(oldestMessage.createdAt);

      console.warn(
        "Loading Older Messages before",
        createdAtDate.toLocaleString(),
        messages.length
      );

      const olderMessages = await fetchMessages(
        {
          channelId,
          channelType: "post",
          limit: 50,
          before: createdAtDate.toISOString(),
        },
        {
          prepend: true,
          onSuccess: () => {
            // Preserve scroll position after prepending messages
            // Use requestAnimationFrame to ensure DOM has updated
            requestAnimationFrame(() => {
              if (container) {
                const newScrollHeight = container.scrollHeight;
                const scrollDifference = newScrollHeight - previousScrollHeight;
                container.scrollTop += scrollDifference;
              }
            });
          },
          onError: (error) => {
            console.error("Failed to load older messages:", error);
          },
        }
      );

      if (olderMessages.length < 50) {
        setHasMoreOlderMessages(false);
      }
    } catch (error) {
      console.error("Error loading older messages:", error);
    } finally {
      setIsLoadingOlderMessages(false);
      isLoadingOlderMessagesRef.current = false;
    }
  }, [channelId, messages, hasMoreOlderMessages]);

  // Detect when user scrolls near bottom and mark as read
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !channelId || !currentUser) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const isNearBottom = distanceFromBottom < 100; // 100px threshold

      // Mark as read when user is near the bottom
      if (isNearBottom && !hasMarkedAsReadRef.current) {
        markChannelAsRead(
          { channelId },
          {
            onSuccess: () => {
              // Store will be updated via socket event
            },
            onError: (error) => {
              console.error("Failed to mark channel as read:", error);
            },
          }
        );
        hasMarkedAsReadRef.current = true;
      } else if (!isNearBottom) {
        // Reset the flag when user scrolls away from bottom
        hasMarkedAsReadRef.current = false;
      }
    };

    container.addEventListener("scroll", handleScroll);
    // Also check on initial load if already at bottom
    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [channelId, currentUser]);

  // Reset infinite scroll state when channel changes
  useEffect(() => {
    setHasMoreOlderMessages(true);
    setIsLoadingOlderMessages(false);
    isLoadingOlderMessagesRef.current = false;
  }, [channelId]);

  // Check if initial load already got all messages (if less than 100, there are no more)
  useEffect(() => {
    if (messages.length > 0 && messages.length < 100)
      setHasMoreOlderMessages(false);
  }, [messages.length]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        messageInputRef.current?.appendText(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="h-[calc(100vh-48px)] flex flex-col w-full">
      <div
        ref={messagesContainerRef}
        className="overflow-y-auto py-4 space-y-2 relative no-scrollbar flex-1 min-w-[400px]"
      >
        <InfiniteScroll
          onLoadMore={loadOlderMessages}
          hasMore={hasMoreOlderMessages}
          isLoading={isLoadingOlderMessages}
          containerRef={messagesContainerRef}
          enabled={messages.length > 0}
          loadingComponent={
            <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
              Loading older messages...
            </div>
          }
          endComponent={
            <div className="flex items-center justify-center py-2 text-xs text-muted-foreground">
              No more messages
            </div>
          }
        />
        <MessagesList
          messages={messages}
          emptyMessage="No messages yet. Start a conversation!"
        />
      </div>
      <div className="p-4">
        <MessageInput
          ref={messageInputRef}
          channelId={channelId}
          channelType="post"
          onSend={scrollToBottom}
        />
      </div>
    </div>
  );
};
