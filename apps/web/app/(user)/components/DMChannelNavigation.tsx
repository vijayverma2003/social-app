"use client";

import { useChannelsStore } from "@/features/dms/store/channelsStore";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useDMChannelsStore } from "@/stores/dmChannelStore";
import { fetchDMChannels } from "@/services/dmChannelsService";
import { DMChannelNavItem } from "./DMChannelNavItem";

const DMChannelNavigation = () => {
  const channels = useChannelsStore(useShallow((state) => state.channels));
  const dmChannels = useDMChannelsStore(
    useShallow((state) => state.dmChannels)
  );

  useEffect(() => {
    fetchDMChannels();
  }, []);

  return (
    <nav className="flex flex-col gap-2 flex-1 rounded-2xl max-h-fit overflow-y-auto">
      {
        <div className="mb-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
            Direct Messages
          </p>
          {Object.values(dmChannels).map((channel) => (
            <DMChannelNavItem key={channel.id} channel={channel} />
          ))}
        </div>
      }

      {channels.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No channels yet
        </p>
      )}
    </nav>
  );
};

export default DMChannelNavigation;
