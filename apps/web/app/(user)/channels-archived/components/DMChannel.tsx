"use client";

import ProfileCard from "@/app/(user)/components/ProfileCard";
import { ViewProfileButton } from "@/app/(user)/components/ViewProfileButton";
import { AddFriendButton } from "@/features/friends/components/AddFriendButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useFriendsStore } from "@/features/friends/store/friendsStore";
import { InfiniteScroll } from "@/app/(user)/components/InfiniteScroll";
import { MessageInput } from "@/app/(user)/channels/components/MessageInput";
import { MessagesList } from "@/features/messages/components/MessagesList";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useUser } from "@/providers/UserContextProvider";
import { useDMChannelsStore } from "@/stores/dmChannelStore";
import { useProfilesStore } from "@/stores/profilesStore";
import { MessageData } from "@shared/schemas/messages";
import { useCallback, useMemo } from "react";
import { useChannelMessages } from "../hooks/useChannelMessages";
import { useConversationPreview } from "@/contexts/conversationPreviewContext";
import { cn } from "@/lib/utils";
import MainHeader from "@/app/(user)/components/MainHeader";

interface DMChannelProps {
  channelId: string;
  aroundMessageId?: string;
}

export const DMChannel = ({ channelId, aroundMessageId }: DMChannelProps) => {
  const { user: currentUser } = useUser();
  const dmChannel = useDMChannelsStore((state) => state.dmChannels[channelId]);
  const resetUnreadCount = useDMChannelsStore(
    (state) => state.resetUnreadCount
  );
  const { state: { isOpen } } = useConversationPreview()

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
    isInitialLoading,
  } = useChannelMessages({
    channelId,
    channelType: "dm",
    onMarkAsReadSuccess: handleMarkAsReadSuccess,
    aroundMessageId,
  });

  const otherUser = useProfilesStore((state) => state.getProfile(otherUserId));
  const isFriend = useFriendsStore((state) => state.isFriend(otherUserId));

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
    <>
      <MainHeader>
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarImage src={otherUser?.avatarURL || undefined} />
            <AvatarFallback>{otherUser?.displayName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <p className="text-sm font-medium">{otherUser?.displayName}</p>
        </div>
      </MainHeader>
      <div className={cn("w-full grid", isOpen ? "grid-cols-[1fr_0px]" : "max-lg:grid-cols-1 grid-cols-[1fr_360px]")}>
        <div className="h-[calc(100vh-48px)] flex flex-col">
          <div className="flex-1" />

          <div
            ref={messagesContainerRef}
            className="overflow-y-auto py-4 space-y-2 relative no-scrollbar min-w-[400px]"
          >
            {/* <div className="p-4 flex flex-col gap-4 items-center">
              <Avatar className="size-16">
                <AvatarImage src={otherUser?.avatarURL || undefined} />
                <AvatarFallback>{otherUser?.displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2 items-center">
                <h1 className="text-lg font-bold">{otherUser?.displayName}</h1>
                <div className="flex items-center gap-1">
                  <ViewProfileButton userId={otherUserId} as="button" size="sm" text="View Profile" variant="secondary" />
                  {isFriend && (
                    <Button size="sm" variant="destructive">Remove Friend</Button>
                  )}
                  {!isFriend && otherUserId && (
                    <AddFriendButton userId={otherUserId} size="sm" variant="secondary" />
                  )}
                </div>
                <p className="text-xs mt-4">This is the beginning of your direct message conversation with {otherUser?.displayName}.</p>
              </div>
            </div>
            <div className="px-4">
              <Separator />
            </div> */}
            <InfiniteScroll
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
              endComponent={<></>}
            />
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
              channelType="dm"
              onSend={scrollToBottom}
            />
          </div>
        </div>
        {!isOpen && <div className="p-6">
          <ProfileCard userId={otherUserId} variant="popover" />
        </div>}
      </div>
    </>
  );
};
