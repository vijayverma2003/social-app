"use client";

import ProfileCard from "@/app/(user)/settings/profile/components/ProfileCard";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ProfileCardPopoverProps {
  children: ReactNode;
  className?: string;
  userId?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
}

export const ProfileCardPopover = ({
  children,
  className,
  userId,
  align = "end",
  side = "right",
}: ProfileCardPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger className={cn(className, "cursor-pointer")}>
        {children}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        side={side}
        className="p-0 border-0 bg-transparent w-full ring-0"
      >
        <ProfileCard variant="popover" userId={userId} />
      </PopoverContent>
    </Popover>
  );
};
