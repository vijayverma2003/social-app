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
import MainContent from "./components/MainContent";

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
            <MainContent>{children}</MainContent>
          </div>
        </ConversationPreviewProvider >
      </ProfileCardViewerProvider >
    </SettingsProvider >
  );
};

export default Layout;
