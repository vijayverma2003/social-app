"use client";

import MainHeader from "@/app/(user)/components/MainHeader";
import { useParams } from "next/navigation";
import { DMChannel } from "./components/DMChannel";
import { PostChannel } from "./components/PostChannel";

const ChannelPage = () => {
  const params = useParams();
  const postId = params?.postId as string;
  const channelId = params?.channelId as string;

  // Determine channel type: if postId is "@me", it's a DM channel, otherwise it's a post channel
  const channelType = postId === "%40me" ? "dm" : "post";

  if (!channelId) return <div>Invalid channel</div>;

  return (
    <section className="h-screen overflow-hidden flex flex-col">
      {channelType === "dm" ? (
        <DMChannel channelId={channelId} />
      ) : (
        <PostChannel channelId={channelId} />
      )}
    </section>
  );
};

export default ChannelPage;
