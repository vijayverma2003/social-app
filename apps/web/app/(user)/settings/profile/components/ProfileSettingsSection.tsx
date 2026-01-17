"use client";

import { UserWithProfile } from "@shared/types";
import ProfileSettingsForm from "./ProfileSettingsForm";
import { useUser } from "@/providers/UserContextProvider";



export const ProfileSettingsSection = () => {
  const { user } = useUser();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-md font-semibold">Profile Settings</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage your profile information and preferences
        </p>
      </div>
      <ProfileSettingsForm user={user} />
    </div>
  );
};
