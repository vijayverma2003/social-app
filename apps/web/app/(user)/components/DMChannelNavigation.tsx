"use client";

import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useDMChannelsStore } from "@/stores/dmChannelStore";
import { fetchDMChannels } from "@/services/dmChannelsService";
import { DMChannelNavItem } from "./DMChannelNavItem";

const DMChannelNavigation = () => {
  const { dmChannels, lastMessageTimestamps } = useDMChannelsStore(
    useShallow((state) => ({
      dmChannels: state.dmChannels,
      lastMessageTimestamps: state.lastMessageTimestamps,
    }))
  );

  useEffect(() => {
    fetchDMChannels();
  }, []);

  // Sort DM channels by most recent message timestamp
  const sortedDMChannels = useMemo(() => {
    const channelsArray = Object.values(dmChannels);
    return channelsArray.sort((a, b) => {
      const timestampA = lastMessageTimestamps[a.id] || new Date(a.createdAt).getTime();
      const timestampB = lastMessageTimestamps[b.id] || new Date(b.createdAt).getTime();
      return timestampB - timestampA; // Most recent first
    });
  }, [dmChannels, lastMessageTimestamps]);

  return (
    <div className="flex flex-col gap-2 flex-1 rounded-2xl max-h-fit max-xl:gap-2 max-xl:items-center">

      <p className="hidden xl:block text-xs font-semibold text-muted-foreground px-2">
        Direct Messages
      </p>
      {sortedDMChannels.map((channel) => (
        <DMChannelNavItem key={channel.id} channel={channel} />
      ))}
    </div>
  );
};

export default DMChannelNavigation;
