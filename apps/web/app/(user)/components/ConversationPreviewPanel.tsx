"use client";

import { useConversationPreview } from "@/contexts/conversationPreviewContext";
import Channel from "../channels/components/Channel";

export const ConversationPreviewPanel = () => {
  const {
    state: { channelId, postId, isOpen },
  } = useConversationPreview();

  if (!isOpen || !channelId) {
    return null;
  }

  return (
    <aside className="w-full lg:w-[480px] lg:max-w-[480px] border border-b-0 border-r-0 border-border bg-background h-full ml-2 rounded-tl-3xl flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          <Channel
            channelType={postId ? "post" : "dm"}
            channelId={channelId}
            postId={postId || "@me"}
            isConversationPreview
          />
        </div>
      </div>
    </aside>
  );
};
