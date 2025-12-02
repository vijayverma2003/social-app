"use client";

import { Button } from "@/components/ui/button";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { cn } from "@/lib/utils";
import { useFriendRequestsStore } from "@/store/friendRequestsStore";
import { Home, MessageCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ConnectionsNavigation from "../connections/components/UserNavigation";
import ProfileSettingsNavigation from "../settings/profile/components/ProfileSettingsNavigation";

const Navbar = () => {
  const pathname = usePathname();
  const incomingCount = useFriendRequestsStore(
    (state) => state.received.length
  );
  const hasIncoming = incomingCount > 0;

  return (
    <aside className="min-h-screen w-64 border-r border-border bg-background p-4 flex flex-col gap-4 overflow-y-scroll">
      <div className="mb-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span>Social App</span>
        </Link>
      </div>

      <nav className="flex flex-col gap-2 flex-1 bg-accent/50 p-4 rounded-2xl max-h-fit">
        <Link href="/">
          <Button
            variant={pathname === "/" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3",
              pathname === "/" && "bg-secondary"
            )}
          >
            <Home className="size-5" />
            <span>Home</span>
          </Button>
        </Link>
        <Link href="/connections">
          <Button
            variant={pathname === "/connections" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 relative",
              pathname === "/connections" && "bg-secondary"
            )}
          >
            <MessageCircle className="size-5" />
            <span>Friends & DMs</span>
            {hasIncoming && <NotificationBadge count={incomingCount} />}
          </Button>
        </Link>
      </nav>

      {pathname.startsWith("/settings") && <ProfileSettingsNavigation />}
      {pathname.startsWith("/connections") && <ConnectionsNavigation />}
    </aside>
  );
};

export default Navbar;
