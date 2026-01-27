"use client";

import { ConversationPreview } from "@/features/posts/components/ConversationPreview";
import { useConversationPreview } from "@/contexts/conversationPreviewContext";

export const ConversationPreviewPanel = () => {
  const {
    state: { channelId, postId, title, isOpen },
    closeConversation,
  } = useConversationPreview();

  if (!isOpen || !channelId) {
    return null;
  }

  return (
    <aside className="w-full md:max-w-[480px] border border-b-0 border-r-0 border-border bg-background h-full ml-2 rounded-t-3xl">
      <ConversationPreview
        channelId={channelId}
        postId={postId ?? undefined}
        onClose={closeConversation}
        title={title}
      />
    </aside>
  );
};

