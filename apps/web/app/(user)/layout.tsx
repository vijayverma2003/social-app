"use client";

import { PropsWithChildren } from "react";
import MainHeader from "./components/MainHeader";
import Navbar from "./components/Navbar";
import { useFriendRequestsBootstrap } from "@/features/friends/hooks/useFriendRequestsBootstrap";
import { useFriendsBootstrap } from "@/features/friends/hooks/useFriendsBootstrap";
import { useChannelsBootstrap } from "@/features/dms/hooks/useChannelsBootstrap";
import { usePostChannelsBootstrap } from "@/features/posts/hooks/usePostChannelsBootstrap";

const Layout = ({ children }: PropsWithChildren) => {
  useFriendRequestsBootstrap();
  useFriendsBootstrap();
  useChannelsBootstrap();
  usePostChannelsBootstrap();

  return (
    <div className="flex h-screen">
      <Navbar />
      <main className="flex flex-1 flex-col overflow-y-auto">
        <MainHeader />
        <div className="flex-1 p-4">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
