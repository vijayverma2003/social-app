"use client";

import MessagePreview from "./MessagePreview";
import { MessageData } from "@shared/schemas/messages";
import { ChannelWithUsers } from "@shared/types/responses";
import { useMemo } from "react";

interface MessagesListProps {
  messages: MessageData[];
  channelUsers: ChannelWithUsers["users"];
  emptyMessage?: string;
  className?: string;
}

export const MessagesList = ({
  messages,
  channelUsers,
  emptyMessage = "No messages yet. Start a conversation!",
  className = "",
}: MessagesListProps) => {
  // Create a map for O(1) lookup instead of O(n) find for each message
  const userMap = useMemo(() => {
    const map = new Map<string, ChannelWithUsers["users"][0]>();
    channelUsers.forEach((user) => {
      map.set(user.userId, user);
    });
    return map;
  }, [channelUsers]);

  if (messages.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">{emptyMessage}</p>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {messages.map((message, index) => {
        const channelUser = userMap.get(message.authorId);
        const lastMessage = index > 0 ? messages[index - 1] : null;

        return (
          <MessagePreview
            key={message._id}
            message={message}
            profile={channelUser?.profile || null}
            lastMessage={lastMessage}
          />
        );
      })}
    </div>
  );
};
