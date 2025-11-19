"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@clerk/nextjs";
import { Bell, Search, User } from "lucide-react";
import Link from "next/link";

const MainHeader = () => {
  const { isSignedIn, user } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6 gap-4">
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input type="search" placeholder="Search..." className="pl-10" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-5" />
            </Button>
          </Link>

          {isSignedIn ? (
            <Link href="/settings/profile">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="size-8">
                  <AvatarImage
                    src={user?.imageUrl}
                    alt={user?.firstName || "User"}
                  />
                  <AvatarFallback>
                    {user?.firstName?.[0] ||
                      user?.emailAddresses[0]?.emailAddress?.[0] ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </Link>
          ) : (
            <Link href="/profile">
              <Button variant="ghost" size="icon">
                <User className="size-5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default MainHeader;
