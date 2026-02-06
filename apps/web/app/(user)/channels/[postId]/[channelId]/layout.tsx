"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import {
  startListeningChannelEvents,
  stopListeningChannelEvents,
} from "@/services/channelService";

export default function ChannelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const channelId = params?.channelId as string;

  useEffect(() => {
    if (!channelId) return;

    startListeningChannelEvents({ channelId }).catch(() => {
      // Join can fail if user lacks access; leave cleanup will still run
    });

    return () => {
      stopListeningChannelEvents({ channelId }).catch(() => {});
    };
  }, [channelId]);

  return <>{children}</>;
}
