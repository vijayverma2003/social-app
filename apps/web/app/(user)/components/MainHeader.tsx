"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Search } from "lucide-react";
import Link from "next/link";

const MainHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-background mb-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10 py-5 border-none bg-secondary/50 ring-0 focus-visible:ring-0 focus-visible:border-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default MainHeader;
