"use client";

import { useDMChannelActions } from "@/features/dms/hooks/useDMChannelActions";
import { useMessagesBootstrap } from "@/features/messages/hooks/useMessagesBootstrap";
import { useMessagesStore } from "@/features/messages/store/messagesStore";
import { useParams } from "next/navigation";
import { useEffect } from "react";

const DMChannelPage = () => {
  const params = useParams();
  const channelId = params?.channelId as string;
  const { joinChannel, leaveChannel } = useDMChannelActions();

  useEffect(() => {
    if (!channelId) return;
    joinChannel(channelId);

    return () => {
      leaveChannel(channelId);
    };
  }, [channelId, joinChannel, leaveChannel]);

  useMessagesBootstrap();

  return (
    <div>
      <h1>DM Channel Page - {channelId}</h1>
    </div>
  );
};

export default DMChannelPage;
