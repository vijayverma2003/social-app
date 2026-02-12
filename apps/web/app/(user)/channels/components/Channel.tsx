"use client";

import {
  MessageInput,
  MessageInputRef,
} from "@/app/(user)/channels/components/MessageInput";
import { MessageInputProvider } from "@/app/(user)/channels/contexts/MessageInputContext";
import { useConversationPreview } from "@/contexts/conversationPreviewContext";
import { cn } from "@/lib/utils";
import { getPostChannel } from "@/services/channelService";
import { fetchMessages } from "@/services/messagesService";
import { useMessagesStore } from "@/stores/messagesStore";
import { ChannelType } from "@shared/schemas/messages";
import type { Channel } from "@shared/types/responses";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import Chat from "./Chat";
import ChatSkeleton from "./ChatSkeleton";
import DMChannelHeader from "./DMChannelHeader";
import DMChannelSidebar from "./DMChannelSidebar";
import PostChannelHeader from "./PostChannelHeader";
import PostChannelSidebar from "./PostChannelSidebar";

const PAGE_SIZE = 50;
const NEAR_BOTTOM_THRESHOLD_PX = 100;

interface ChannelProps {
  channelType: ChannelType;
  channelId: string;
  postId: string;
  isConversationPreview?: boolean;
}

const Channel = ({
  channelType,
  channelId,
  postId,
  isConversationPreview,
}: ChannelProps) => {
  console.log(channelType, channelId, postId);
  const messageInputRef = useRef<MessageInputRef>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const {
    state: { isOpen },
    closeConversation,
  } = useConversationPreview();

  const messages = useMessagesStore(
    useShallow((state) => state.messagesByChannel[channelId] || []),
  );
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const fetchMessagesData = useCallback(async () => {
    try {
      setIsInitialLoading(true);
      await fetchMessages({ channelId, channelType, limit: PAGE_SIZE });
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch messages");
    } finally {
      setIsInitialLoading(false);
    }
  }, [channelId, channelType]);

  const fetchPostChannelData = useCallback(async () => {
    if (channelType !== "post") return;
    try {
      await getPostChannel(channelId);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch post channel");
    }
  }, [channelId]);

  useEffect(() => {
    fetchMessagesData();
    fetchPostChannelData();
  }, [fetchMessagesData, fetchPostChannelData, channelId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      if (active?.closest("textarea") || active?.closest("input")) {
        return;
      }
      if (e.key.length !== 1 || ["Enter", "Escape", "Tab"].includes(e.key))
        return;
      e.preventDefault();
      messageInputRef.current?.focus();
      messageInputRef.current?.appendText(e.key);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <main className="h-full min-h-0 flex flex-col">
      {channelType === "dm" ? (
        <DMChannelHeader channelId={channelId} isConversationPreview={isConversationPreview} />
      ) : channelType === "post" ? (
        <PostChannelHeader postId={postId} isConversationPreview={isConversationPreview} />
      ) : (
        <header className="p-3 border-b">
          <h1>{channelId}</h1>
        </header>
      )}

      <div
        className={cn(
          "grid flex-1 min-h-0",
          isOpen
            ? "grid-cols-[1fr_0px]"
            : "max-lg:grid-cols-1 grid-cols-[1fr_360px]",
        )}
      >
        <MessageInputProvider messageInputRef={messageInputRef}>
          <div className="flex flex-col w-full h-full min-h-0">
            <div
              ref={messagesContainerRef}
              className="min-h-0 h-full overflow-y-auto mb-4"
            >
              {isInitialLoading && messages.length === 0 ? (
                <ChatSkeleton skeletonCount={10} />
              ) : (
                <Chat
                  postId={postId}
                  channelId={channelId}
                  channelType={channelType}
                  messages={messages}
                  initialLoadingComplete={!isInitialLoading}
                />
              )}
            </div>

            <div className="p-2 shrink-0">
              <MessageInput
                ref={messageInputRef}
                channelId={channelId}
                channelType={channelType}
              />
            </div>
          </div>
        </MessageInputProvider>
        {channelType === "dm" ? (
          <DMChannelSidebar channelId={channelId} />
        ) : channelType === "post" ? (
          <PostChannelSidebar postId={postId} />
        ) : null}
      </div>
    </main>
  );
};

export default Channel;
