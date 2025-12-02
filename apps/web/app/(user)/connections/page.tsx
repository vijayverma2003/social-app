"use client";

import { getFriends } from "@/services/friends";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FriendsListResponse } from "@shared/types";

const ConnectionsPage = () => {
  const { getToken } = useAuth();
  const [friends, setFriends] = useState<FriendsListResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        {friends.map((friend) => {
          return (
            <div
              key={friend.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-accent/50 p-4"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={friend.profile?.avatarURL || ""} />
                  <AvatarFallback>
                    {friend.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{friend.username}</p>
                  {friend.profile?.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {friend.profile.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConnectionsPage;
