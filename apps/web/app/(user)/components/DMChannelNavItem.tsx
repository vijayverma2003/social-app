"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { NotificationBadge } from "@/components/custom/notification-badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ChannelWithUsers } from "@shared/types/responses";
import { usePathname } from "next/navigation";
import { useUser } from "@/providers/UserContextProvider";
import { useShallow } from "zustand/react/shallow";
import { useProfilesStore } from "@/stores/profilesStore";

interface DMChannelNavItemProps {
  channel: ChannelWithUsers;
}

export const DMChannelNavItem = ({ channel }: DMChannelNavItemProps) => {
  const pathname = usePathname();
  const { user: currentUser } = useUser();

  const otherUserId =
    channel.users.find((u) => u.userId !== currentUser?.id)?.userId || "";

  const otherUserProfile = useProfilesStore(
    useShallow((state) => state.getProfile(otherUserId))
  );

  const getUnreadCount = () => {
    if (!currentUser) return 0;
    const channelUser = channel.users.find((u) => u.userId === currentUser.id);
    return channelUser?.totalUnreadMessages || 0;
  };

  const href = `/channels/@me/${channel.id}`;
  const isActive = pathname === href;
  const unreadCount = getUnreadCount();
  const displayName = otherUserProfile?.displayName || "Unknown";
  const avatarURL = otherUserProfile?.avatarURL || undefined;
  const fallbackInitial = displayName.charAt(0).toUpperCase() || "?";

  return (
    <Link key={channel.id} href={href}>
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start gap-3 relative h-auto py-2 px-3 mb-1",
          isActive && "bg-secondary"
        )}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarURL} />
          <AvatarFallback>{fallbackInitial}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium truncate">{displayName}</p>
        </div>
        {unreadCount > 0 && <NotificationBadge count={unreadCount} />}
      </Button>
    </Link>
  );
};
