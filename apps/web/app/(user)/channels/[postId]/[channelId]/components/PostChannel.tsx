"use client";

import { InfiniteScroll } from "@/features/messages/components/InfiniteScroll";
import { MessageInput } from "@/features/messages/components/MessageInput";
import { MessagesList } from "@/features/messages/components/MessagesList";
import { useChannelMessages } from "../hooks/useChannelMessages";

interface PostChannelProps {
  channelId: string;
}

export const PostChannel = ({ channelId }: PostChannelProps) => {
  const {
    messagesContainerRef,
    messageInputRef,
    messages,
    isLoadingOlderMessages,
    hasMoreOlderMessages,
    loadOlderMessages,
    scrollToBottom,
  } = useChannelMessages({
    channelId,
    channelType: "post",
  });

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
