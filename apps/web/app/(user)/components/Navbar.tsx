"use client";

import { Button } from "@/components/ui/button";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { cn } from "@/lib/utils";
import { useFriendRequestsStore } from "@/store/friendRequestsStore";
import {
  Home,
  MessageCircle,
  UserPlus,
  Mail,
  LucideIcon,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ProfileSettingsNavigation from "../settings/profile/components/ProfileSettingsNavigation";
import DMNavigation from "../friends/components/DMNavigation";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  showBadge?: boolean;
}

const Navbar = () => {
  const pathname = usePathname();
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
    {
      href: "/message-requests",
      label: "Message Requests",
      icon: Mail,
    },
  ];

  return (
    <aside className="min-h-screen w-64 border-r border-border bg-background p-4 flex flex-col gap-4 overflow-y-scroll">
      <div className="mb-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span>Social App</span>
        </Link>
      </div>

      <nav className="flex flex-col gap-2 flex-1 bg-accent/50 p-4 rounded-2xl max-h-fit">
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
      </nav>

      {pathname.startsWith("/settings") ? (
        <ProfileSettingsNavigation />
      ) : (
        <DMNavigation />
      )}
    </aside>
  );
};

export default Navbar;
