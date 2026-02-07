"use client";

import { MessageInput } from "@/app/(user)/channels/components/MessageInput";
import { MessagesList } from "@/features/messages/components/MessagesList";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useChannelMessages } from "../hooks/useChannelMessages";
import { MessageData } from "@shared/schemas/messages";
import { useCallback } from "react";
import { Spinner } from "@/components/ui/spinner";

interface PostChannelProps {
  channelId: string;
  aroundMessageId?: string;
}

export const PostChannel = ({ channelId, aroundMessageId }: PostChannelProps) => {
  const {
    messagesContainerRef,
    messageInputRef,
    messages,
    isLoadingOlderMessages,
    hasMoreOlderMessages,
    loadOlderMessages,
    scrollToBottom,
    isInitialLoading,
  } = useChannelMessages({
    channelId,
    channelType: "post",
    aroundMessageId,
  });

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => messagesContainerRef.current,
    estimateSize: () => 80,
    overscan: 20,
    enabled: messages.length > 0,
    measureElement:
      typeof window !== "undefined" &&
        navigator.userAgent.indexOf("Firefox") === -1
        ? (element: Element | null) =>
          element?.getBoundingClientRect().height ?? 80
        : undefined,
  });

  const handleEditMessage = useCallback(
    (
      messageId: string,
      messageContent: string,
      attachments?: MessageData["attachments"]
    ) => {
      if (messageInputRef.current) {
        messageInputRef.current.startEditing(
          messageId,
          messageContent,
          attachments
        );
      }
    },
    []
  );

  const handleReplyMessage = useCallback(
    (message: MessageData) => {
      if (messageInputRef.current) {
        messageInputRef.current.startReply(message);
      }
    },
    []
  );

  return (
    <div className="h-[calc(100vh-48px)] flex flex-col w-full">
      <div className="flex-1" />
      <div
        ref={messagesContainerRef}
        className="overflow-y-auto py-4 space-y-2 relative no-scrollbar min-w-[400px]"
      >

        {/* <InfiniteScroll
          onLoadMore={loadOlderMessages}
          hasMore={hasMoreOlderMessages}
          isLoading={isLoadingOlderMessages}
          containerRef={messagesContainerRef}
          enabled={messages.length > 0}
          loadingComponent={
            <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
              <Spinner />
            </div>
          }
          endComponent={<>?</>}
        /> */}
        <MessagesList
          messages={messages}
          emptyMessage="No messages yet. Start a conversation!"
          onEditMessage={handleEditMessage}
          onReplyMessage={handleReplyMessage}
          containerRef={messagesContainerRef}
          isLoading={isInitialLoading && messages.length === 0}
          initialScrollToMessageId={aroundMessageId}
          virtualizer={virtualizer as any}
        />
      </div>
      <div className="p-2 mb-3">
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
