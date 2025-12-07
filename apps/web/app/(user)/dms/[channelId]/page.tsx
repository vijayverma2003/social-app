"use client";

import { useDMChannelActions } from "@/features/dms/hooks/useDMChannelActions";
import {
  MessageInput,
  MessageInputRef,
} from "@/features/messages/components/MessageInput";
import MessagePreview from "@/features/messages/components/MessagePreview";
import { useMessagesBootstrap } from "@/features/messages/hooks/useMessagesBootstrap";
import { useMessagesStore } from "@/features/messages/store/messagesStore";
import { useDMChannelsStore } from "@/features/dms/store/dmChannelsStore";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";

const DMChannelPage = () => {
  const params = useParams();
  const channelId = params?.channelId as string;
  const { joinChannel, leaveChannel } = useDMChannelActions();
  const { channels } = useDMChannelsStore();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<MessageInputRef>(null);

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

    return () => {
      leaveChannel(channelId);
    };
  }, [channelId, joinChannel, leaveChannel]);

  useMessagesBootstrap(channelId, "dm", scrollToBottom, scrollToBottom);

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

  return (
    <div className="flex flex-col h-full justify-end">
      <div ref={messagesContainerRef} className="overflow-y-auto p-4">
        <h1 className="text-2xl font-bold mb-4">
          DM Channel -{" "}
          {channelUsers
            .map((dmChannelUser) => dmChannelUser.user.profile?.displayName)
            .join(", ")}
        </h1>
        {messages.length === 0 ? (
          <p className="text-muted-foreground">
            No messages yet. Start a conversation!
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((message) => {
              const dmChannelUser = channelUsers.find(
                (user) => user.userId === message.authorId
              );
              return (
                <MessagePreview
                  message={message}
                  key={message._id}
                  profile={dmChannelUser?.user.profile || null}
                />
              );
            })}
          </div>
        )}
      </div>
      <MessageInput
        ref={messageInputRef}
        channelId={channelId}
        channelType="dm"
        onSend={scrollToBottom}
      />
    </div>
  );
};

export default DMChannelPage;
