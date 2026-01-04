"use client";

import { MessageData } from "@shared/schemas/messages";
import MessagePreview from "./MessagePreview";

interface MessagesListProps {
  messages: MessageData[];
  emptyMessage?: string;
  className?: string;
}

export const MessagesList = ({
  messages,
  emptyMessage = "No messages yet. Start a conversation!",
  className = "",
}: MessagesListProps) => {
  if (messages.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">{emptyMessage}</p>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className} h-full`}>
      <div className="flex-1" />
      {messages.map((message, index) => {
        const lastMessage = index > 0 ? messages[index - 1] : null;

        return (
          <MessagePreview
            key={message.id}
            message={message}
            lastMessage={lastMessage}
          />
        );
      })}
    </div>
  );
};
