"use client";

import { PropsWithChildren } from "react";
import Navbar from "./components/Navbar";
import { useFriendRequestsBootstrap } from "@/features/friends/hooks/useFriendRequestsBootstrap";
import { useFriendsBootstrap } from "@/features/friends/hooks/useFriendsBootstrap";
import { useChannelsBootstrap } from "@/features/dms/hooks/useChannelsBootstrap";
import { usePostChannelsBootstrap } from "@/features/posts/hooks/usePostChannelsBootstrap";
import { usePostsBootstrap } from "@/features/posts/hooks/usePostsBootstrap";
import { useProfilesBootstrap } from "@/hooks/useProfilesBootstrap";

const Layout = ({ children }: PropsWithChildren) => {
  useFriendRequestsBootstrap();
  useFriendsBootstrap();
  useChannelsBootstrap();
  usePostChannelsBootstrap();
  usePostsBootstrap();
  useProfilesBootstrap();

  return (
    <div className="flex h-screen">
      <Navbar />
      <main className="flex flex-1 flex-col overflow-y-auto border-l border-border bg-background">
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
