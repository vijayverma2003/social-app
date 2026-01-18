"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { ProfileCardDialog } from "@/app/(user)/components/ProfileCardDialog";

interface ProfileCardViewerContextType {
  openProfileCard: (userId?: string) => void;
  closeProfileCard: () => void;
  isOpen: boolean;
  userId: string | undefined;
}

const ProfileCardViewerContext = createContext<
  ProfileCardViewerContextType | undefined
>(undefined);

export const ProfileCardViewerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  const openProfileCard = useCallback((userId?: string) => {
    setUserId(userId);
    setIsOpen(true);
  }, []);

  const closeProfileCard = useCallback(() => {
    setIsOpen(false);
    // Clear userId after a short delay to allow dialog close animation
    setTimeout(() => {
      setUserId(undefined);
    }, 200);
  }, []);

  return (
    <ProfileCardViewerContext.Provider
      value={{
        openProfileCard,
        closeProfileCard,
        isOpen,
        userId,
      }}
    >
      {children}
      <ProfileCardDialog
        open={isOpen}
        setOpen={(open) => {
          if (!open) {
            closeProfileCard();
          }
        }}
        userId={userId}
      />
    </ProfileCardViewerContext.Provider>
  );
};

export const useProfileCardViewer = () => {
  const context = useContext(ProfileCardViewerContext);
  if (!context) {
    throw new Error(
      "useProfileCardViewer must be used within a ProfileCardViewerProvider"
    );
  }
  return context;
};
