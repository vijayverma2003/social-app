"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ProfileSettingsNavigation = () => {
  const pathname = usePathname();

  const profileSettingsRoutes = [
    {
      label: "Account",
      href: "/settings/account",
    },
    {
      label: "Profile",
      href: "/settings/profile",
    },
  ];

  return (
    <nav className="flex flex-col gap-2 flex-1 bg-accent/50 p-4 rounded-2xl max-h-fit">
      {profileSettingsRoutes.map((route) => (
        <Link key={route.href} href={route.href}>
          <Button
            variant={pathname === route.href ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3",
              pathname === route.href && "bg-secondary"
            )}
          >
            <span>{route.label}</span>
          </Button>
        </Link>
      ))}
    </nav>
  );
};

export default ProfileSettingsNavigation;
