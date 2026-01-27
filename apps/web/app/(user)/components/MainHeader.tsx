"use client";

import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import Link from "next/link";
import { PropsWithChildren } from "react";

const MainHeader = ({ children }: PropsWithChildren) => {
  return (
    <header className="shrink-0 w-full py-2 px-4 border-b border-border bg-background flex items-center justify-between gap-4">
      {children}

      <div className="flex items-center gap-4">
        <Link href="/notifications">
          <Button variant="ghost" size="icon-sm" className="relative">
            <Bell size="4" />
          </Button>
        </Link>
      </div>
    </header>
  );
};

export default MainHeader;
