"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SettingsSection = "profile" | "account";

interface SettingsNavigationProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

const settingsSections: { id: SettingsSection; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "account", label: "Account" },
];

export const SettingsNavigation = ({
  activeSection,
  onSectionChange,
}: SettingsNavigationProps) => {
  return (
    <aside className="w-64 border-r border-border p-4 flex flex-col backdrop-blur-xl">
      <div className="mb-6 px-2">
        <h2 className="text-lg font-semibold">Settings</h2>
      </div>
      <nav className="flex flex-col gap-2">
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
    </aside>
  );
};
