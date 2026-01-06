"use client";

import ProfilePreview from "@/app/(user)/settings/profile/components/ProfilePreview";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ProfilePopoverProps {
  children: ReactNode;
  className?: string;
}

export const ProfilePopover = ({
  children,
  className,
}: ProfilePopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger className={cn(className, "cursor-pointer")}>
        {children}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        className="p-0 border-0 bg-transparent min-w-[360px] w-full"
      >
        <ProfilePreview />
      </PopoverContent>
    </Popover>
  );
};
