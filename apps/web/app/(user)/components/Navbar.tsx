"use client";

import { NotificationBadge } from "@/components/custom/notification-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { useSettings } from "@/contexts/settingsContext";
import { useFriendRequestsStore } from "@/features/friends/store/friendRequestsStore";
import { useMessageRequestsStore } from "@/features/messages/store/messageRequestsStore";
import { CreatePostDialog } from "@/features/posts/components/CreatePostDialog";
import { cn } from "@/lib/utils";
import { useUser } from "@/providers/UserContextProvider";
import { Clock, Home, LucideIcon, MessageCircle, Plus, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useState } from "react";
import DMChannelNavigation from "./DMChannelNavigation";
import { ProfileCardPopover } from "./ProfileCardPopover";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  showBadge?: boolean;
}

const Navbar = () => {
  const pathname = usePathname();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const { openSettings } = useSettings();
  const incomingCount = useFriendRequestsStore(
    (state) => state.received.length
  );
  const hasIncoming = incomingCount > 0;
  const messageRequestsCount = useMessageRequestsStore(
    (state) => state.requests.length
  );
  const hasMessageRequests = messageRequestsCount > 0;
  const { user } = useUser();

  const navItems: NavItem[] = [
    {
      href: "/home",
      label: "Home",
      icon: Home,
    },
    {
      href: "/recents",
      label: "Recents",
      icon: Clock,
    },
    {
      href: "/friends",
      label: "Friends",
      icon: Users,
      showBadge: true,
    },
    // Only show Message Requests tab if there are any message requests
    ...(hasMessageRequests
      ? [
        {
          href: "/message-requests",
          label: "Message Requests",
          icon: MessageCircle,
          showBadge: true,
        },
      ]
      : []),
  ];

  return (
    <div className="overflow-hidden">
      <aside className="h-screen w-56 p-2 flex flex-col gap-4 overflow-y-auto no-scrollbar relative">
        <div className="mb-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span>Social App</span>
          </Link>
        </div>
        <nav className="flex flex-col gap-2 flex-1 rounded-2xl max-h-fit">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const showNotificationBadge =
              item.showBadge &&
              (item.href === "/friends"
                ? hasIncoming
                : item.href === "/message-requests"
                  ? hasMessageRequests
                  : false);
            const badgeCount =
              item.href === "/friends"
                ? incomingCount
                : item.href === "/message-requests"
                  ? messageRequestsCount
                  : 0;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    showNotificationBadge && "relative",
                    isActive && "bg-secondary"
                  )}
                >
                  <Icon className="size-5" />
                  <span>{item.label}</span>
                  {showNotificationBadge && (
                    <NotificationBadge count={badgeCount} />
                  )}
                </Button>
              </Link>
            );
          })}
          <Button
            onClick={() => setIsCreatePostOpen(true)}
            className={cn(
              buttonVariants({ variant: "default" }),
              "w-full justify-start gap-3 mb-2"
            )}
          >
            <Plus className="size-5" />
            <span>Create Post</span>
          </Button>
          <CreatePostDialog
            open={isCreatePostOpen}
            onOpenChange={setIsCreatePostOpen}
          />
        </nav>
        <div className="flex-1">
          <DMChannelNavigation />
        </div>
      </aside>
      <ProfileCardPopover
        align="start"
        side="top"
        className="bg-secondary/50 backdrop-blur-2xl w-full px-2 py-2 flex items-center justify-between gap-4 sticky bottom-0 border-none"
      >
        <div className="flex items-center gap-2">
          <Avatar className="size-12 border-2 border-muted">
            <AvatarImage src={user?.profile?.avatarURL || undefined} />
            <AvatarFallback>
              {user?.profile?.displayName?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <p className="text-sm font-medium">{user?.profile?.displayName}</p>
            <p className="text-xs text-muted-foreground">
              {user?.username + "#" + user?.discriminator}
            </p>
          </div>
        </div>
      </ProfileCardPopover>
      <Button
        onClick={(e) => {
          e.stopPropagation();
          openSettings();
        }}
        variant="ghost"
        size="icon"
        aria-label="Open settings"
      >
        <Settings color="var(--muted-foreground)" className="size-5" />
      </Button>
    </div>
  );
};

export default memo(Navbar);
