"use client";

import { useChannelActions } from "@/features/dms/hooks/useChannelActions";
import {
  MessageInput,
  MessageInputRef,
} from "@/features/messages/components/MessageInput";
import { MessagesList } from "@/features/messages/components/MessagesList";
import { useMessagesBootstrap } from "@/features/messages/hooks/useMessagesBootstrap";
import { useMessagesStore } from "@/features/messages/store/messagesStore";
import { useChannelsStore } from "@/features/dms/store/channelsStore";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useUser } from "@/providers/UserContextProvider";
import { ChannelType } from "@shared/schemas/messages";

const ChannelPage = () => {
  const params = useParams();
  const postId = params?.postId as string;
  const channelId = params?.channelId as string;
  const { joinChannel, leaveChannel, markAsRead } = useChannelActions();
  const { channels } = useChannelsStore();
  const { user: currentUser } = useUser();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<MessageInputRef>(null);
  const hasMarkedAsReadRef = useRef(false);

  // Determine channel type: if postId is "@me", it's a DM channel, otherwise it's a post channel
  const channelType: ChannelType = postId === "@me" ? "dm" : "post";

  const channelUsers = useMemo(() => {
    return channels.find((channel) => channel.id === channelId)?.users || [];
  }, [channels, channelId]);

  const messagesSelector = useMemo(
    () => (state: ReturnType<typeof useMessagesStore.getState>) =>
      channelId ? state.messagesByChannel[channelId] || [] : [],
    [channelId]
  );

  const messages = useMessagesStore(useShallow(messagesSelector));
  const previousMessagesLengthRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    if (!messagesContainerRef.current) return;

    messagesContainerRef.current.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    const currentLength = messages.length;
    const previousLength = previousMessagesLengthRef.current;

    if (currentLength > previousLength && currentLength > 0) {
      setTimeout(scrollToBottom, 0);
    }

    previousMessagesLengthRef.current = currentLength;
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    if (!channelId) return;
    joinChannel(channelId);
    hasMarkedAsReadRef.current = false;

    return () => {
      leaveChannel(channelId);
    };
  }, [channelId, joinChannel, leaveChannel]);

  // Detect when user scrolls to bottom and mark as read
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !channelId || !currentUser) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50; // 50px threshold

      if (isAtBottom && !hasMarkedAsReadRef.current) {
        markAsRead(channelId);
        hasMarkedAsReadRef.current = true;
      } else if (!isAtBottom) {
        hasMarkedAsReadRef.current = false;
      }
    };

    container.addEventListener("scroll", handleScroll);
    // Also check on initial load if already at bottom
    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [channelId, currentUser, markAsRead]);

  useMessagesBootstrap(channelId, channelType, scrollToBottom, scrollToBottom);

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

  if (!channelId) return <div>Invalid channel</div>;

  const channelTitle =
    channelType === "dm"
      ? `DM Channel - ${channelUsers
          .map((channelUser) => channelUser.profile?.displayName)
          .join(", ")}`
      : `Post Channel - ${channelId}`;

  return (
    <div className="flex flex-col h-full justify-end">
      <div ref={messagesContainerRef} className="overflow-y-auto p-4">
        <h1 className="text-2xl font-bold mb-4">{channelTitle}</h1>
        <MessagesList
          messages={messages}
          channelUsers={channelUsers}
          emptyMessage="No messages yet. Start a conversation!"
        />
      </div>
      <MessageInput
        ref={messageInputRef}
        channelId={channelId}
        channelType={channelType}
        onSend={scrollToBottom}
      />
    </div>
  );
};

export default ChannelPage;
