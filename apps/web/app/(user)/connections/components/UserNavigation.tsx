"use client";

import { Button } from "@/components/ui/button";
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
  const incomingLabel = incomingCount > 10 ? "10+" : incomingCount.toString();

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
              <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {incomingLabel}
              </span>
            )}
          </Button>
        </Link>
      ))}
    </nav>
  );
};

export default ConnectionsNavigation;
