"use client";

import { useSocket } from "@/contexts/socket";
import { POST_EVENTS } from "@shared/socketEvents";
import { ServerToClientEvents } from "@shared/types/socket";
import { usePostsStore } from "../store/postsStore";
import { useEffect } from "react";

export const usePostsBootstrap = () => {
  const { socket } = useSocket();
  const { prependPost, updatePost, removePost } = usePostsStore();

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

    const handlePostLiked = (
      post: Parameters<ServerToClientEvents[typeof POST_EVENTS.LIKED]>[0]
    ) => {
      updatePost(post);
    };

    const handlePostUnliked = (
      post: Parameters<ServerToClientEvents[typeof POST_EVENTS.UNLIKED]>[0]
    ) => {
      updatePost(post);
    };

    const handlePostDeleted = (
      data: Parameters<ServerToClientEvents[typeof POST_EVENTS.DELETED]>[0]
    ) => {
      removePost(data.postId);
    };

    socket.on(POST_EVENTS.CREATED, handlePostCreated);
    socket.on(POST_EVENTS.UPDATED, handlePostUpdated);
    socket.on(POST_EVENTS.DELETED, handlePostDeleted);
    socket.on(POST_EVENTS.LIKED, handlePostLiked);
    socket.on(POST_EVENTS.UNLIKED, handlePostUnliked);

    return () => {
      socket.off(POST_EVENTS.CREATED, handlePostCreated);
      socket.off(POST_EVENTS.UPDATED, handlePostUpdated);
      socket.off(POST_EVENTS.DELETED, handlePostDeleted);
      socket.off(POST_EVENTS.LIKED, handlePostLiked);
      socket.off(POST_EVENTS.UNLIKED, handlePostUnliked);
    };
  }, [socket, prependPost, updatePost, removePost]);
};
