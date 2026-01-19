"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useClerk } from "@clerk/nextjs";

export type SettingsSection = "profile" | "account";

interface SettingsNavigationProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

const settingsSections: { id: SettingsSection; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "account", label: "Account" },
];

const LogoutButton = () => {
  const { signOut } = useClerk();

  const handleLogout = () => {
    void signOut({ redirectUrl: "/" });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "mt-4 w-full justify-start text-destructive hover:text-destructive"
        )}
      >
        Log out
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Log out</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to log out? You will need to sign in again to
            access your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleLogout}>
            Log out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const SettingsNavigation = ({
  activeSection,
  onSectionChange,
}: SettingsNavigationProps) => {
  return (
    <aside className="w-64 border-r border-border p-4 flex flex-col backdrop-blur-xl">
      <div className="mb-6 px-2">
        <h2 className="text-lg font-semibold">Settings</h2>
      </div>
      <nav className="flex flex-col gap-2 flex-1">
        {settingsSections.map((section) => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              activeSection === section.id && "bg-secondary"
            )}
            onClick={() => onSectionChange(section.id)}
          >
            {section.label}
          </Button>
        ))}
      </nav>

      <LogoutButton />
    </aside>
  );
};
