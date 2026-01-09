"use client";

import { useSocket } from "@/contexts/socket";
import { USER_EVENTS } from "@shared/socketEvents";
import { ServerToClientEvents } from "@shared/types/socket";
import { useProfilesStore } from "@/stores/profilesStore";
import { useEffect } from "react";

export const useProfilesBootstrap = () => {
  const { socket } = useSocket();
  const { updateProfile } = useProfilesStore();

  useEffect(() => {
    if (!socket) return;

    const handleProfileUpdated = (
      profile: Parameters<
        ServerToClientEvents[typeof USER_EVENTS.PROFILE_UPDATED]
      >[0]
    ) => {
      updateProfile(profile);
    };

    socket.on(USER_EVENTS.PROFILE_UPDATED, handleProfileUpdated);

    return () => {
      socket.off(USER_EVENTS.PROFILE_UPDATED, handleProfileUpdated);
    };
  }, [socket, updateProfile]);
};
