"use client";

import { ChannelType } from "@shared/schemas/messages";
import { useParams } from "next/navigation";
import Channel from "../../components/Channel";

const page = () => {
  const params = useParams();
  const postId = params?.postId as string;
  const channelId = params?.channelId as string;
  const channelType: ChannelType = postId === "%40me" ? "dm" : "post";

  console.log("Post Id: ", postId);

  return (
    <Channel channelType={channelType} channelId={channelId} postId={postId} />
  );
};

export default page;
