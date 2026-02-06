"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { getDMChannel } from "@/services/dmChannelsService";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { toast } from "sonner";

type SendMessageButtonBase = {
  userId: string;
  channelId?: string | null;
  children: ReactNode;
  disabled?: boolean;
};

type AsDropdownItem = SendMessageButtonBase & {
  as: "dropdown-item";
};

type AsButton = SendMessageButtonBase & {
  as: "button";
  size?: "sm" | "default" | "icon";
} & Omit<ComponentPropsWithoutRef<typeof Button>, "children" | "size">;

export type SendMessageButtonProps = AsDropdownItem | AsButton;

export function SendMessageButton(props: SendMessageButtonProps) {
  const pathname = usePathname();
  const { userId, channelId, children, disabled: disabledProp } = props;
  const router = useRouter();

  const handleClick = async () => {
    if (!userId) return;

    const channelPath = (channelId: string) => `/channels/@me/${channelId}`;

    if (channelId && pathname.startsWith(channelPath(channelId))) {
      return;
    } else if (channelId) {
      router.push(channelPath(channelId));
      return
    }

    try {
      const channel = await getDMChannel(userId);
      router.push(channelPath(channel.id));
    } catch (error) {
      toast.error("Failed to open DM channel");
      console.error("Failed to open DM channel:", error);
    }
  };

  const disabled = disabledProp || !userId;

  if (props.as === "dropdown-item") {
    return (
      <DropdownMenuItem
        onClick={handleClick}
        className="cursor-pointer"
        disabled={disabled}
      >
        {children}
      </DropdownMenuItem>
    );
  }

  const { as: _as, size = "default", disabled: _d, userId: _u, channelId: _c, ...rest } = props;
  return (
    <Button
      type="button"
      size={size}
      onClick={handleClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </Button>
  );
}
