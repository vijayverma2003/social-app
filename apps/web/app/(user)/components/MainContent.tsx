"use client";

import { PropsWithChildren } from "react";
import { ConversationPreviewPanel } from "./ConversationPreviewPanel";
import { useConversationPreview } from "@/contexts/conversationPreviewContext";
import { cn } from "@/lib/utils";

export const MainContent = ({ children }: PropsWithChildren) => {
  const { state: { isOpen } } = useConversationPreview();

  return (
    <div className="flex flex-1 mt-2">
      <main className={cn("flex flex-1 overflow-hidden border border-border border-b-0 bg-background rounded-t-3xl", isOpen && "max-lg:hidden")}>
        <div className="flex-1">{children}</div>
      </main>
      <ConversationPreviewPanel />
    </div>
  );
};

export default MainContent;

