"use client";

import { ConversationPreviewProvider } from "@/contexts/conversationPreviewContext";
import { ProfileCardViewerProvider } from "@/contexts/profileCardViewer";
import { SettingsProvider } from "@/contexts/settingsContext";
import { useFriendRequestsBootstrap } from "@/features/friends/hooks/useFriendRequestsBootstrap";
import { useFriendsBootstrap } from "@/features/friends/hooks/useFriendsBootstrap";
import { useMessageRequestsBootstrap } from "@/features/messages/hooks/useMessageRequestsBootstrap";
import { usePostsBootstrap } from "@/features/posts/hooks/usePostsBootstrap";
import { useMessagesBootstrap } from "@/hooks/messages/useMessagesBootstrap";
import { useProfilesBootstrap } from "@/hooks/useProfilesBootstrap";
import { PropsWithChildren } from "react";
import MainContent from "./components/MainContent";
import Navbar from "./components/Navbar";

const Layout = ({ children }: PropsWithChildren) => {
  useFriendRequestsBootstrap();
  useFriendsBootstrap();
  usePostsBootstrap();
  useProfilesBootstrap();
  useMessagesBootstrap();
  useMessageRequestsBootstrap();

  return (
    <SettingsProvider>
      <ProfileCardViewerProvider>
        <ConversationPreviewProvider>
          <div className="flex h-dvh">
            <Navbar />
            <MainContent>{children}</MainContent>
          </div>
        </ConversationPreviewProvider >
      </ProfileCardViewerProvider >
    </SettingsProvider >
  );
};

export default Layout;
