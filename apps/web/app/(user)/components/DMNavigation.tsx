"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { cn } from "@/lib/utils";
import { useDMChannelsStore } from "@/features/dms/store/dmChannelsStore";
import { DMChannelWithUsers } from "@shared/types/responses";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/providers/UserContextProvider";

const DMNavigation = () => {
  const pathname = usePathname();
  const { channels, isLoading } = useDMChannelsStore();
  const { user: currentUser, isLoading: isLoadingCurrentUser } = useUser();

  const getOtherUser = (channel: DMChannelWithUsers) => {
    // Find the user that is not the current user
    // Only proceed if currentUser is loaded
    if (!currentUser) return null;
    return (
      channel.users.find((u) => u.userId !== currentUser.id) || channel.users[0]
    );
  };

  const getUnreadCount = (channel: DMChannelWithUsers) => {
    if (!currentUser) return 0;
    const channelUser = channel.users.find((u) => u.userId === currentUser.id);
    return channelUser?.totalUnreadMessages || 0;
  };

  // Don't render channels until currentUser is loaded to prevent showing wrong users
  if (isLoading || isLoadingCurrentUser) {
    return (
      <nav className="flex flex-col gap-2 flex-1 bg-accent/50 p-4 rounded-2xl max-h-fit overflow-y-auto">
        <p className="text-sm text-muted-foreground text-center py-4">
          Loading...
        </p>
      </nav>
    );
  }

  // If currentUser failed to load, don't render channels to avoid showing incorrect data
  if (!currentUser) {
    return (
      <nav className="flex flex-col gap-2 flex-1 bg-accent/50 p-4 rounded-2xl max-h-fit overflow-y-auto">
        <p className="text-sm text-muted-foreground text-center py-4">
          Unable to load user data
        </p>
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-2 flex-1 bg-accent/50 p-4 rounded-2xl max-h-fit overflow-y-auto">
      {channels.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No direct messages yet
        </p>
      ) : (
        channels
          .map((channel) => {
            const otherUser = getOtherUser(channel);
            const unreadCount = getUnreadCount(channel);
            const isActive = pathname === `/dms/${channel.id}`;

            if (!otherUser) return null;

            return (
              <Link key={channel.id} href={`/dms/${channel.id}`}>
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
                      {otherUser.user.profile?.displayName
                        ?.charAt(0)
                        .toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate">
                      {otherUser.user.profile?.displayName || "Unknown"}
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
