"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { ProfileSettingsDialog } from "@/app/(user)/components/Settings";
import type { SettingsSection } from "@/app/(user)/components/SettingsNavigation";

interface SettingsContextType {
  openSettings: (section?: SettingsSection) => void;
  closeSettings: () => void;
  isOpen: boolean;
  activeSection: SettingsSection;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");

  const openSettings = useCallback((section: SettingsSection = "profile") => {
    setActiveSection(section);
    setIsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        openSettings,
        closeSettings,
        isOpen,
        activeSection,
      }}
    >
      {children}
      <ProfileSettingsDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeSettings();
          }
        }}
        initialSection={activeSection}
      />
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
