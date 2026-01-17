"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import { useUser } from "@/providers/UserContextProvider";
import { SettingsNavigation, type SettingsSection } from "./SettingsNavigation";
import { ProfileSettingsSection } from "./ProfileSettingsSection";
import { AccountSettingsSection } from "./AccountSettingsSection";

interface ProfileSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileSettingsDialog = ({
  open,
  onOpenChange,
}: ProfileSettingsDialogProps) => {
  const { user } = useUser();

  if (!user) {
    return null;
  }

  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[75vw]! w-full h-[85vh] p-0 flex flex-col max-lg:max-w-[100vw]! max-lg:h-screen! ">
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar Navigation */}
          <SettingsNavigation
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />

          {/* Right Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeSection === "profile" && (<ProfileSettingsSection />)}
            {activeSection === "account" && <AccountSettingsSection />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
