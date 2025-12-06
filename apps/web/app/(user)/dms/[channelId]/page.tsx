"use client";

import { useSocket } from "@/providers/SocketContextProvider";
import { useParams } from "next/navigation";
import { useEffect } from "react";

const DMChannelPage = () => {
  const { channelId } = useParams();
  const { emit } = useSocket();

  return (
    <div>
      <h1>DM Channel Page - {channelId}</h1>
    </div>
  );
};

export default DMChannelPage;
