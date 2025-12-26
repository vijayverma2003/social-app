"use client";

import { Button } from "@/components/ui/button";
import { useChannelsStore } from "@/features/dms/store/channelsStore";
import { MessagesList } from "@/features/messages/components/MessagesList";
import { useMessagesBootstrap } from "@/features/messages/hooks/useMessagesBootstrap";
import { useMessagesStore } from "@/features/messages/store/messagesStore";
import { ChannelType } from "@shared/schemas/messages";
import { X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

interface ConversationPreviewProps {
  channelId: string;
  postId: string;
  onClose?: () => void;
  title?: string;
}

export const ConversationPreview = ({
  channelId,
  postId,
  onClose,
  title = "Conversation",
}: ConversationPreviewProps) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const channelType: ChannelType = "post";

  // Use shallow selector to only subscribe to the specific channel we need
  const channelUsers = useChannelsStore(
    useShallow((state) => {
      return (
        state.channels.find((channel) => channel.id === channelId)?.users || []
      );
    })
  );

  const messagesSelector = useMemo(
    () => (state: ReturnType<typeof useMessagesStore.getState>) =>
      channelId ? state.messagesByChannel[channelId] || [] : [],
    [channelId]
  );

  const messages = useMessagesStore(useShallow(messagesSelector));

  const scrollToBottom = useCallback(
    (behavior: "smooth" | "instant" | "auto" = "smooth") => {
      if (!messagesContainerRef.current) return;
      console.log("Scrolling to bottom");
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
    },
    []
  );

  useEffect(() => {
    console.log("Calling scrollToBottom");
    scrollToBottom("instant");
  }, [scrollToBottom]);

  useMessagesBootstrap(channelId, channelType, scrollToBottom);

  if (!channelId) return null;

  return (
    <div className="flex flex-col h-[50vh] bg-secondary/50 rounded-2xl w-full">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {onClose && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="h-6 w-6"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      <div className="flex-1" />

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="overflow-y-auto p-4 space-y-2 relative no-scrollbar"
      >
        <MessagesList
          messages={messages}
          channelUsers={channelUsers}
          emptyMessage="No messages yet. Be the first to comment!"
        />
      </div>

      {/* Join Chat Button */}
      <div className="p-4">
        <Link
          href={`/channels/${postId}/${channelId}`}
          className="block"
          onClick={(e) => e.stopPropagation()}
        >
          <Button className="w-full font-medium cursor-pointer">
            Join Chat
          </Button>
        </Link>
      </div>
    </div>
  );
};
