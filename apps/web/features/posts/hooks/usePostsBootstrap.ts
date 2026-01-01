"use client";

import { useSocket } from "@/contexts/socket";
import { POST_EVENTS } from "@shared/socketEvents";
import { ServerToClientEvents } from "@shared/types/socket";
import { usePostsStore } from "../store/postsStore";
import { useEffect } from "react";

export const usePostsBootstrap = () => {
  const { socket } = useSocket();
  const { prependPost, updatePost } = usePostsStore();

  useEffect(() => {
    if (!socket) return;

    const handlePostCreated = (
      post: Parameters<ServerToClientEvents[typeof POST_EVENTS.CREATED]>[0]
    ) => {
      prependPost(post);
    };

    const handlePostUpdated = (
      post: Parameters<ServerToClientEvents[typeof POST_EVENTS.UPDATED]>[0]
    ) => {
      updatePost(post);
    };

    socket.on(POST_EVENTS.CREATED, handlePostCreated);
    socket.on(POST_EVENTS.UPDATED, handlePostUpdated);

    return () => {
      socket.off(POST_EVENTS.CREATED, handlePostCreated);
      socket.off(POST_EVENTS.UPDATED, handlePostUpdated);
    };
  }, [socket, prependPost, updatePost]);
};
