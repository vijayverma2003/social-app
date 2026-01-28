"use client";

import { PropsWithChildren } from "react";
import Navbar from "./components/Navbar";
import { ProfileCardViewerProvider } from "@/contexts/profileCardViewer";
import { SettingsProvider } from "@/contexts/settingsContext";
import { useFriendRequestsBootstrap } from "@/features/friends/hooks/useFriendRequestsBootstrap";
import { useFriendsBootstrap } from "@/features/friends/hooks/useFriendsBootstrap";
import { useChannelsBootstrap } from "@/features/dms/hooks/useChannelsBootstrap";
import { usePostChannelsBootstrap } from "@/features/posts/hooks/usePostChannelsBootstrap";
import { usePostsBootstrap } from "@/features/posts/hooks/usePostsBootstrap";
import { useProfilesBootstrap } from "@/hooks/useProfilesBootstrap";
import { useMessageRequestsBootstrap } from "@/features/messages/hooks/useMessageRequestsBootstrap";
import { useDMMessagesBootstrap } from "@/features/dms/hooks/useDMMessagesBootstrap";
import { ConversationPreviewProvider } from "@/contexts/conversationPreviewContext";
import { ConversationPreviewPanel } from "./components/ConversationPreviewPanel";

const Layout = ({ children }: PropsWithChildren) => {
  useFriendRequestsBootstrap();
  useFriendsBootstrap();
  useChannelsBootstrap();
  usePostChannelsBootstrap();
  usePostsBootstrap();
  useProfilesBootstrap();
  useMessageRequestsBootstrap();
  useDMMessagesBootstrap();

  return (
    <SettingsProvider>
      <ProfileCardViewerProvider>
        <ConversationPreviewProvider>
          <div className="flex h-screen">
            <Navbar />
            <div className="flex flex-1 mt-2">
              <main className="flex flex-1 overflow-hidden border border-border border-b-0 bg-background rounded-t-3xl">
                <div className="flex-1">{children}</div>
              </main>
              <ConversationPreviewPanel />
            </div>
          </div>
        </ConversationPreviewProvider >
      </ProfileCardViewerProvider >
    </SettingsProvider >
  );
};

export default Layout;
