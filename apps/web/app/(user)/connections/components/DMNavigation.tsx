"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { cn } from "@/lib/utils";
import { useDMChannelsStore } from "@/store/dmChannelsStore";
import { useAuth } from "@clerk/nextjs";
import { DMChannelResponse } from "@shared/types/responses";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/services/users";

const DMNavigation = () => {
  const pathname = usePathname();
  const { channels, isLoading } = useDMChannelsStore();
  const { getToken } = useAuth();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Load current user ID
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const response = await getCurrentUser(token);
        setCurrentUserId(response.data.id);
      } catch (error) {
        console.error("Failed to load current user:", error);
      }
    };

    loadCurrentUser();
  }, [getToken]);

  const getOtherUser = (channel: DMChannelResponse) => {
    // Find the user that is not the current user
    if (!currentUserId) return channel.users[0];
    return (
      channel.users.find((u) => u.userId !== currentUserId) || channel.users[0]
    );
  };

  const getUnreadCount = (channel: DMChannelResponse) => {
    if (!currentUserId) return 0;
    const channelUser = channel.users.find((u) => u.userId === currentUserId);
    return channelUser?.totalUnreadMessages || 0;
  };

  return (
    <nav className="flex flex-col gap-2 flex-1 bg-accent/50 p-4 rounded-2xl max-h-fit overflow-y-auto">
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Loading...
        </p>
      ) : channels.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No direct messages yet
        </p>
      ) : (
        channels
          .map((channel) => {
            const otherUser = getOtherUser(channel);
            const unreadCount = getUnreadCount(channel);
            const isActive = pathname === `/connections/dm/${channel.id}`;

            if (!otherUser) return null;

            return (
              <Link key={channel.id} href={`/connections/dm/${channel.id}`}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 relative h-auto py-2 px-3",
                    isActive && "bg-secondary"
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={otherUser.user.profile?.avatarURL || ""}
                    />
                    <AvatarFallback>
                      {otherUser.user.username.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate">
                      {otherUser.user.username || "Unknown"}
                      {otherUser.user.discriminator && (
                        <span className="text-muted-foreground">
                          #{otherUser.user.discriminator}
                        </span>
                      )}
                    </p>
                  </div>
                  {unreadCount > 0 && <NotificationBadge count={unreadCount} />}
                </Button>
              </Link>
            );
          })
          .filter(Boolean)
      )}
    </nav>
  );
};

export default DMNavigation;
