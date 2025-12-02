"use client";

import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export function NotificationBadge({
  count,
  className,
}: NotificationBadgeProps) {
  const label = count > 10 ? "10+" : count.toString();

  return (
    <span
      className={cn(
        "ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-700 px-1 text-[10px] font-bold text-white",
        className
      )}
    >
      {label}
    </span>
  );
}
