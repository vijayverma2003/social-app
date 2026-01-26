"use client";

import ProfileCard from "@/app/(user)/components/ProfileCard";
import { InfiniteScroll } from "@/features/messages/components/InfiniteScroll";
import { MessageInput } from "@/features/messages/components/MessageInput";
import { MessagesList } from "@/features/messages/components/MessagesList";
import { useUser } from "@/providers/UserContextProvider";
import { useDMChannelsStore } from "@/stores/dmChannelStore";
import { useMemo, useCallback } from "react";
import { useChannelMessages } from "../hooks/useChannelMessages";
import { MessageData } from "@shared/schemas/messages";

interface DMChannelProps {
  channelId: string;
}

export const DMChannel = ({ channelId }: DMChannelProps) => {
  const { user: currentUser } = useUser();
  const dmChannel = useDMChannelsStore((state) => state.dmChannels[channelId]);
  const resetUnreadCount = useDMChannelsStore(
    (state) => state.resetUnreadCount
  );

  const otherUserId =
    dmChannel?.users.find((u) => u.userId !== currentUser?.id)?.userId || "";

  // Get current user's unread count from the channel
  const currentUserUnreadCount = useMemo(() => {
    if (dmChannel && currentUser?.id) {
      const channelUser = dmChannel.users.find(
        (u) => u.userId === currentUser.id
      );
      return channelUser?.totalUnreadMessages || 0;
    }
    return 0;
  }, [dmChannel, currentUser?.id]);

  // Callback to update store when marking as read
  const handleMarkAsReadSuccess = useCallback(() => {
    // Update the store immediately if there are unread messages
    // This ensures the UI updates even if the socket event is delayed
    if (currentUser?.id && currentUserUnreadCount > 0) {
      resetUnreadCount(channelId, currentUser.id);
    }
  }, [channelId, currentUser?.id, currentUserUnreadCount, resetUnreadCount]);

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
    channelType: "dm",
    onMarkAsReadSuccess: handleMarkAsReadSuccess,
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
    <div className="w-full grid grid-cols-[1fr_360px]">
      <div className="h-[calc(100vh-48px)] flex flex-col">
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
            onEditMessage={handleEditMessage}
            onReplyMessage={handleReplyMessage}
            containerRef={messagesContainerRef}
          />
        </div>
        <div className="p-4">
          <MessageInput
            ref={messageInputRef}
            channelId={channelId}
            channelType="dm"
            onSend={scrollToBottom}
          />
        </div>  
      </div>
      <div className="p-6">
        <ProfileCard userId={otherUserId} variant="popover" />
      </div>
    </div>
  );
};
