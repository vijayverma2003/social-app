"use client";

import { useState, FormEvent, KeyboardEvent, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useMessageActions } from "../hooks/useMessageActions";
import { ChannelType } from "@shared/schemas/messages";

interface MessageInputProps {
  channelId: string;
  channelType: ChannelType;
  onSend?: () => void;
}

export const MessageInput = ({
  channelId,
  channelType,
  onSend,
}: MessageInputProps) => {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { createMessage } = useMessageActions();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedContent = content.trim();
    if (!trimmedContent || isSending) return;

    setIsSending(true);

    createMessage(
      {
        channelId,
        channelType,
        content: trimmedContent,
      },
      (messageId) => {
        setIsSending(false);
        if (messageId) {
          inputRef.current?.focus();
          setContent("");
          onSend?.();
        }
      }
    );
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 border-t p-4 bg-background"
    >
      <Input
        ref={inputRef}
        type="text"
        placeholder="Type a message..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isSending}
        className="flex-1"
        autoComplete="off"
      />
      <Button
        type="submit"
        disabled={!content.trim() || isSending}
        size="icon"
        aria-label="Send message"
      >
        <Send className="size-4" />
      </Button>
    </form>
  );
};
