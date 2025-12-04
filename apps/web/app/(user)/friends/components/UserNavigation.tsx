"use client";

import { Button } from "@/components/ui/button";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { cn } from "@/lib/utils";
import { useFriendRequestsStore } from "@/store/friendRequestsStore";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ConnectionsNavigation = () => {
  const pathname = usePathname();
  const incomingCount = useFriendRequestsStore(
    (state) => state.received.length
  );
  const hasIncoming = incomingCount > 0;

  const connectionsRoutes = [
    {
      label: "Friend Requests",
      href: "/connections/friend-requests",
    },
    {
      label: "Message Requests",
      href: "/connections/message-requests",
    },
  ];

  return (
    <nav className="flex flex-col gap-2 flex-1 bg-accent/50 p-4 rounded-2xl max-h-fit">
      {connectionsRoutes.map((route) => (
        <Link key={route.href} href={route.href}>
          <Button
            variant={pathname === route.href ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 relative",
              pathname === route.href && "bg-secondary"
            )}
          >
            <span>{route.label}</span>
            {route.href === "/connections/friend-requests" && hasIncoming && (
              <NotificationBadge count={incomingCount} />
            )}
          </Button>
        </Link>
      ))}
    </nav>
  );
};

export default ConnectionsNavigation;
