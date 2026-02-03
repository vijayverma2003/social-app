"use client";

import { Button } from "@/components/ui/button";
import { useFriendActions } from "@/features/friends/hooks/useFriendActions";
import { useFriendRequestsStore } from "@/features/friends/store/friendRequestsStore";
import { cn } from "@/lib/utils";
import { Loader2, UserPlus } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { useState } from "react";

type AddFriendButtonProps = Omit<
  ComponentPropsWithoutRef<typeof Button>,
  "children" | "size"
> & {
  userId: string;
  /** Button size: "default" | "sm" (text with label) or "icon" (icon-only) */
  size?: "default" | "sm" | "icon";
};

export function AddFriendButton({
  userId,
  size = "default",
  className,
  disabled,
  ...rest
}: AddFriendButtonProps) {
  const { sendFriendRequestByUserId } = useFriendActions();
  const sent = useFriendRequestsStore((s) => s.sent);
  const [loading, setLoading] = useState(false);

  const isPending = sent.some((r) => r.userId === userId);

  const handleClick = () => {
    if (loading || !userId || isPending) return;
    setLoading(true);
    sendFriendRequestByUserId(userId, () => setLoading(false));
  };

  const label = loading
    ? "Sending..."
    : isPending
      ? "Pending Request"
      : "Add Friend";

  const isDisabled = disabled || loading || !userId || isPending;
  const isIconOnly = size === "icon";

  const content = isIconOnly ? (
    loading ? (
      <Loader2 className="size-4 animate-spin" aria-hidden />
    ) : (
      <UserPlus className="size-4" aria-hidden />
    )
  ) : loading ? (
    <>
      <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
      {label}
    </>
  ) : (
    label
  );

  return (
    <Button
      type="button"
      size={size}
      className={cn(className)}
      disabled={isDisabled}
      onClick={handleClick}
      title={isIconOnly ? label : undefined}
      aria-label={isIconOnly ? label : undefined}
      {...rest}
    >
      {content}
    </Button>
  );
}
