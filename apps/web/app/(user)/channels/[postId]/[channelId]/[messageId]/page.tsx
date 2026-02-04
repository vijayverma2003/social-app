"use client";

import { useParams } from "next/navigation";
import { DMChannel } from "../../../components/DMChannel";
import { PostChannel } from "../../../components/PostChannel";

const ChannelMessagePage = () => {
  const params = useParams();
  const postId = params?.postId as string;
  const channelId = params?.channelId as string | undefined;
  const messageId = params?.messageId as string | undefined;

  console.log(postId, channelId, messageId);

  const channelType = postId === "%40me" ? "dm" : "post";

  if (!channelId) return <div>Invalid channel</div>;

  return (
    <section className="h-screen overflow-hidden flex flex-col">
      {channelType === "dm" ? (
        <DMChannel channelId={channelId} aroundMessageId={messageId} />
      ) : (
        <PostChannel channelId={channelId} aroundMessageId={messageId} />
      )}
    </section>
  );
};

export default ChannelMessagePage;

