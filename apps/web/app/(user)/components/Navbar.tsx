"use client";

import { NotificationBadge } from "@/components/custom/notification-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useFriendRequestsStore } from "@/features/friends/store/friendRequestsStore";
import { CreatePostForm } from "@/features/posts/components/CreatePostForm";
import { cn } from "@/lib/utils";
import { Home, LucideIcon, Plus, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ProfileSettingsNavigation from "../settings/profile/components/ProfileSettingsNavigation";
import ChannelNavigation from "./ChannelNavigation";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  showBadge?: boolean;
}

const Navbar = () => {
  const pathname = usePathname();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const incomingCount = useFriendRequestsStore(
    (state) => state.received.length
  );
  const hasIncoming = incomingCount > 0;

  const navItems: NavItem[] = [
    {
      href: "/home",
      label: "Home",
      icon: Home,
    },
    {
      href: "/friends",
      label: "Friends",
      icon: Users,
      showBadge: true,
    },
  ];

  return (
    <aside className="min-h-screen w-64 bg-background p-4 flex flex-col gap-4 overflow-y-scroll">
      <div className="mb-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span>Social App</span>
        </Link>
      </div>

      <nav className="flex flex-col gap-2 flex-1 bg-secondary/50 p-4 rounded-2xl max-h-fit">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const showNotificationBadge = item.showBadge && hasIncoming;

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
                  <NotificationBadge count={incomingCount} />
                )}
              </Button>
            </Link>
          );
        })}

        <Popover open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
          <PopoverTrigger
            className={cn(
              buttonVariants({ variant: "default" }),
              "w-full justify-start gap-3 mb-2"
            )}
          >
            <Plus className="size-5" />
            <span>Create Post</span>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="start">
            <CreatePostForm
              onSuccess={() => setIsCreatePostOpen(false)}
              onCancel={() => setIsCreatePostOpen(false)}
            />
          </PopoverContent>
        </Popover>
      </nav>

      {pathname.startsWith("/settings") ? (
        <ProfileSettingsNavigation />
      ) : (
        <ChannelNavigation />
      )}
    </aside>
  );
};

export default Navbar;
