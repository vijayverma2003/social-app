"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { NotificationBadge } from "@/components/custom/notification-badge";
import { cn } from "@/lib/utils";
import { useChannelsStore } from "@/features/dms/store/channelsStore";
import { ChannelWithUsers } from "@shared/types/responses";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/providers/UserContextProvider";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

const ChannelNavigation = () => {
  const pathname = usePathname();
  const channels = useChannelsStore(useShallow((state) => state.channels));
  const { user: currentUser } = useUser();

  // Separate DM and post channels
  const { dmChannels, postChannels } = useMemo(() => {
    const dms = channels.filter((ch) => ch.type === "dm");
    const posts = channels.filter((ch) => ch.type === "post");
    return { dmChannels: dms, postChannels: posts };
  }, [channels]);

  const getOtherUser = (channel: ChannelWithUsers) => {
    // Find the user that is not the current user
    // Only proceed if currentUser is loaded
    if (!currentUser) return null;
    return (
      channel.users.find((u) => u.userId !== currentUser.id) || channel.users[0]
    );
  };

  const getUnreadCount = (channel: ChannelWithUsers) => {
    if (!currentUser) return 0;
    const channelUser = channel.users.find((u) => u.userId === currentUser.id);
    return channelUser?.totalUnreadMessages || 0;
  };

  const getChannelHref = (channel: ChannelWithUsers) => {
    if (channel.type === "dm") {
      return `/channels/@me/${channel.id}`;
    } else {
      // For post channels, get the post ID from the channel's posts
      const post = (channel as any).posts?.[0];
      if (post) {
        return `/channels/${post.id}/${channel.id}`;
      }
      return `/channels/${channel.id}/${channel.id}`; // Fallback
    }
  };

  const isChannelActive = (channel: ChannelWithUsers) => {
    const href = getChannelHref(channel);
    return pathname === href;
  };

  return (
    <nav className="flex flex-col gap-2 flex-1 bg-secondary/50 p-4 rounded-2xl max-h-fit overflow-y-auto">
      {/* DM Channels */}
      {
        <div className="mb-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
            Direct Messages
          </p>
          {dmChannels.map((channel) => {
            const otherUser = getOtherUser(channel);
            const unreadCount = getUnreadCount(channel);
            const isActive = isChannelActive(channel);

            if (!otherUser) return null;

            return (
              <Link key={channel.id} href={getChannelHref(channel)}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 relative h-auto py-2 px-3 mb-1",
                    isActive && "bg-secondary"
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={otherUser.profile?.avatarURL || undefined}
                    />
                    <AvatarFallback>
                      {otherUser.profile?.displayName
                        ?.charAt(0)
                        .toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate">
                      {otherUser.profile?.displayName || "Unknown"}
                    </p>
                  </div>
                  {unreadCount > 0 && <NotificationBadge count={unreadCount} />}
                </Button>
              </Link>
            );
          })}
        </div>
      }

      {/* Post Channels */}
      {
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
            Post Channels
          </p>
          {postChannels.map((channel) => {
            const unreadCount = getUnreadCount(channel);
            const isActive = isChannelActive(channel);
            const post = (channel as any).posts?.[0];
            const postAuthor = post?.user;
            const displayName = postAuthor
              ? `${postAuthor.username}${
                  postAuthor.discriminator ? `#${postAuthor.discriminator}` : ""
                }`
              : "Post";

            return (
              <Link key={channel.id} href={getChannelHref(channel)}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 relative h-auto py-2 px-3 mb-1",
                    isActive && "bg-secondary"
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={postAuthor?.profile?.avatarURL || undefined}
                    />
                    <AvatarFallback>
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate">
                      {post?.content
                        ? post.content.substring(0, 30) +
                          (post.content.length > 30 ? "..." : "")
                        : displayName}
                    </p>
                  </div>
                  {unreadCount > 0 && <NotificationBadge count={unreadCount} />}
                </Button>
              </Link>
            );
          })}
        </div>
      }

      {channels.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No channels yet
        </p>
      )}
    </nav>
  );
};

export default ChannelNavigation;
