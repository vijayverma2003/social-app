"use client";

import { getFriends } from "@/services/friends";
import { useFriendsStore } from "@/store/friendsStore";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import FriendsList from "./components/FriendsList";

const ConnectionsPage = () => {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { friends, setFriends } = useFriendsStore();

  useEffect(() => {
    const loadFriends = async () => {
      try {
        setIsLoading(true);
        const token = await getToken();
        const response = await getFriends(token || undefined);
        setFriends(response.data ?? []);
      } catch (err) {
        console.error("Failed to load friends:", err);
        setError("Failed to load friends");
      } finally {
        setIsLoading(false);
      }
    };

    loadFriends();
  }, [getToken]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading friends...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <p className="text-sm text-muted-foreground">
          You don't have any friends yet. Send a friend request to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4 py-4">
      <h2 className="text-sm text-muted-foreground font-bold">Your Friends</h2>
      <div className="space-y-3">
        <FriendsList friends={friends} />
      </div>
    </div>
  );
};

export default ConnectionsPage;
