"use client";

import { ChannelViewProvider } from "@/app/(user)/channels/contexts/ChannelViewContext";
import Channel from "@/app/(user)/channels/components/Channel";
import { ChannelType } from "@shared/schemas/messages";
import { useParams } from "next/navigation";

export default function ChannelMessagePage() {
  const params = useParams();
  const postId = params?.postId as string;
  const channelId = params?.channelId as string;
  const messageId = params?.messageId as string;
  const channelType: ChannelType = postId === "%40me" ? "dm" : "post";

  return (
    <ChannelViewProvider aroundMessageId={messageId}>
      <Channel
        channelType={channelType}
        channelId={channelId}
        postId={postId}
      />
    </ChannelViewProvider>
  );
}
