"use client";

import MessagePreview from "./MessagePreview";
import { MessageData } from "@shared/schemas/messages";
import { ChannelWithUsers } from "@shared/types/responses";

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
  if (messages.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">{emptyMessage}</p>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {messages.map((message, index) => {
        const channelUser = channelUsers.find(
          (user) => user.userId === message.authorId
        );
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
