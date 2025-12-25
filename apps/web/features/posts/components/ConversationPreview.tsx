"use client";

import { Button } from "@/components/ui/button";
import { MessagesList } from "@/features/messages/components/MessagesList";
import { useMessagesBootstrap } from "@/features/messages/hooks/useMessagesBootstrap";
import { useMessagesStore } from "@/features/messages/store/messagesStore";
import { useChannelsStore } from "@/features/dms/store/channelsStore";
import { ChannelType } from "@shared/schemas/messages";
import { useMemo, useEffect, useRef, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import Link from "next/link";
import { LogIn, X } from "lucide-react";

interface ConversationPreviewProps {
  channelId: string;
  postId: string;
  onClose?: () => void;
}

export const ConversationPreview = ({
  channelId,
  postId,
  onClose,
}: ConversationPreviewProps) => {
  const { channels } = useChannelsStore();
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const channelType: ChannelType = "post";

  const channelUsers = useMemo(() => {
    return channels.find((channel) => channel.id === channelId)?.users || [];
  }, [channels, channelId]);

  const messagesSelector = useMemo(
    () => (state: ReturnType<typeof useMessagesStore.getState>) =>
      channelId ? state.messagesByChannel[channelId] || [] : [],
    [channelId]
  );

  const messages = useMessagesStore(useShallow(messagesSelector));

  const scrollToBottom = useCallback(() => {
    if (!messagesContainerRef.current) return;
    messagesContainerRef.current.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  useMessagesBootstrap(channelId, channelType, scrollToBottom);

  if (!channelId) return null;

  return (
    <div className="flex flex-col max-h-[500px] h-full bg-secondary/50 rounded-2xl w-full">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-semibold">Conversation</h2>
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 relative">
        <div
          ref={messagesContainerRef}
          className="bottom-0 absolute w-full left-0 px-4"
        >
          <MessagesList
            messages={messages}
            channelUsers={channelUsers}
            emptyMessage="No messages yet. Be the first to comment!"
          />
        </div>
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
