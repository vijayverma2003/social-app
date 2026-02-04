"use client";

import { useConversationPreview } from "@/contexts/conversationPreviewContext";
import { PostChannel } from "@/app/(user)/channels/components/PostChannel";
import { DMChannel } from "@/app/(user)/channels/components/DMChannel";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { usePostsStore } from "@/features/posts/store/postsStore";
import { useShallow } from "zustand/react/shallow";

export const ConversationPreviewPanel = () => {
  const {
    state: { channelId, postId, isOpen },
    closeConversation,
  } = useConversationPreview();

  const post = usePostsStore(useShallow((state) => state.posts.find((p) => p.id === postId)));

  if (!isOpen || !channelId) {
    return null;
  }

  const isPostChannel = !!postId;

  return (
    <aside className="w-full lg:w-[480px] lg:max-w-[480px] border border-b-0 border-r-0 border-border bg-background h-full ml-2 rounded-tl-3xl flex flex-col overflow-hidden">
      <header className="shrink-0 w-full py-2 px-4 border-b border-border bg-background flex items-center justify-between gap-4">
        <p className="text-sm font-medium">
          {isPostChannel ? post ? (post.content.slice(0, 30) + (post.content.length > 30 ? "..." : "")) : "Post Channel" : "DM Channel"}
        </p>
        <Button
          variant="ghost"
          size="icon-sm"
          className="cursor-pointer"
          onClick={closeConversation}
        >
          <X />
        </Button>
      </header>
      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          {isPostChannel ? (
            <PostChannel channelId={channelId} />
          ) : (
            <DMChannel channelId={channelId} />
          )}
        </div>
      </div>
    </aside>
  );
};

