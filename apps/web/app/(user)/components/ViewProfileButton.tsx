"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useProfileCardViewer } from "@/contexts/profileCardViewer";
import type { ComponentPropsWithoutRef } from "react";

type ViewProfileButtonBase = {
  userId: string;
  text: string;
};

type AsDropdownItem = ViewProfileButtonBase & {
  as: "dropdown-item";
};

type AsButton = ViewProfileButtonBase & {
  as: "button";
  size?: "sm" | "default";
} & Omit<ComponentPropsWithoutRef<typeof Button>, "children" | "size">;

export type ViewProfileButtonProps = AsDropdownItem | AsButton;

export function ViewProfileButton(props: ViewProfileButtonProps) {
  const { userId, text } = props;
  const { openProfileCard } = useProfileCardViewer();

  const handleClick = () => {
    openProfileCard(userId);
  };

  if (props.as === "dropdown-item") {
    return (
      <DropdownMenuItem onClick={handleClick} className="cursor-pointer">
        {text}
      </DropdownMenuItem>
    );
  }

  const { as: _as, size = "default", ...rest } = props;
  return (
    <Button
      type="button"
      size={size}
      onClick={handleClick}
      {...rest}
    >
      {text}
    </Button>
  );
}
