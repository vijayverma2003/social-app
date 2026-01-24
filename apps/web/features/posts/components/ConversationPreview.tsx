"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { MessagesList } from "@/features/messages/components/MessagesList";
import { useMessagesBootstrap } from "@/features/messages/hooks/useMessagesBootstrap";
import { useMessagesStore } from "@/features/messages/store/messagesStore";
import { cn } from "@/lib/utils";
import { ChannelType } from "@shared/schemas/messages";
import { MessageCircle, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

interface ConversationPreviewProps {
  channelId: string;
  postId?: string;
  onClose?: () => void;
  title?: string;
}

export const ConversationPreview = ({
  channelId,
  postId,
  onClose,
  title = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.",
}: ConversationPreviewProps) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const channelType: ChannelType = postId ? "post" : "dm";

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
    scrollToBottom("instant");
  }, [scrollToBottom]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom("smooth");
    }
  }, [messages.length, scrollToBottom]);

  useMessagesBootstrap(channelId, channelType, scrollToBottom);

  if (!channelId) return null;

  return (
    <div className="flex flex-col bg-secondary/50 rounded-2xl w-full max-h-[500px] h-full overflow-hidden justify-between relative">
      <div className="flex items-center justify-between gap-4 px-4 py-2">
        <p className="text-sm font-medium whitespace-nowrap text-ellipsis overflow-hidden">
          {title}
        </p>
        {onClose && (
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="overflow-y-auto space-y-2 relative no-scrollbar mb-16"
      >
        {messages.length > 0 && (
          <div className="my-4">
            <p className="text-muted-foreground text-xs text-center">
              Join the conversation to see the full conversation
            </p>
          </div>
        )}
        <MessagesList messages={messages} containerRef={messagesContainerRef} />
      </div>

      <div className="px-4 pb-4 absolute bottom-0 left-0 w-full">
        <Link
          href={`/channels/${postId}/${channelId}`}
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "w-full font-medium cursor-pointer"
          )}
        >
          <MessageCircle />
          Join Chat
        </Link>
      </div>
    </div>
  );
};
