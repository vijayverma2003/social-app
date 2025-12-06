"use client";

import { useDMChannelActions } from "@/features/dms/hooks/useDMChannelActions";
import { MessageInput } from "@/features/messages/components/MessageInput";
import MessagePreview from "@/features/messages/components/MessagePreview";
import { useMessagesBootstrap } from "@/features/messages/hooks/useMessagesBootstrap";
import { useMessagesStore } from "@/features/messages/store/messagesStore";
import { useDMChannelsStore } from "@/features/dms/store/dmChannelsStore";
import { useParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

const DMChannelPage = () => {
  const params = useParams();
  const channelId = params?.channelId as string;
  const { joinChannel, leaveChannel } = useDMChannelActions();
  const { channels } = useDMChannelsStore();

  const channelUsers = useMemo(() => {
    return channels.find((channel) => channel.id === channelId)?.users || [];
  }, [channels, channelId]);

  const messagesSelector = useMemo(
    () => (state: ReturnType<typeof useMessagesStore.getState>) =>
      channelId ? state.messagesByChannel[channelId] || [] : [],
    [channelId]
  );

  const messages = useMessagesStore(useShallow(messagesSelector));

  useEffect(() => {
    if (!channelId) return;
    joinChannel(channelId);

    return () => {
      leaveChannel(channelId);
    };
  }, [channelId, joinChannel, leaveChannel]);

  useMessagesBootstrap(channelId, "dm");

  if (!channelId) return <div>Invalid channel</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <h1 className="text-2xl font-bold mb-4">
          DM Channel -{" "}
          {channelUsers.map((user) => user.user.username).join(", ")}
        </h1>
        {messages.length === 0 ? (
          <p className="text-muted-foreground">
            No messages yet. Start a conversation!
          </p>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => {
              const user = channelUsers.find(
                (user) => user.userId === message.authorId
              );
              return (
                <MessagePreview
                  message={message}
                  key={message._id}
                  user={user}
                />
              );
            })}
          </div>
        )}
      </div>
      <MessageInput channelId={channelId} channelType="dm" />
    </div>
  );
};

export default DMChannelPage;
