"use client";

import { useSocket } from "@/contexts/socket";
import { POST_EVENTS } from "@shared/socketEvents";
import { postsService } from "@/services/postsService";
import { useEffect } from "react";

export const usePostsBootstrap = () => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handlers = postsService.getPostEventHandlers();

    socket.on(POST_EVENTS.CREATED, handlers.handlePostCreated);
    socket.on(POST_EVENTS.UPDATED, handlers.handlePostUpdated);
    socket.on(POST_EVENTS.DELETED, handlers.handlePostDeleted);
    socket.on(POST_EVENTS.LIKED, handlers.handlePostLiked);
    socket.on(POST_EVENTS.UNLIKED, handlers.handlePostUnliked);
    socket.on(POST_EVENTS.BOOKMARKED, handlers.handlePostBookmarked);
    socket.on(POST_EVENTS.UNBOOKMARKED, handlers.handlePostUnbookmarked);

    return () => {
      socket.off(POST_EVENTS.CREATED, handlers.handlePostCreated);
      socket.off(POST_EVENTS.UPDATED, handlers.handlePostUpdated);
      socket.off(POST_EVENTS.DELETED, handlers.handlePostDeleted);
      socket.off(POST_EVENTS.LIKED, handlers.handlePostLiked);
      socket.off(POST_EVENTS.UNLIKED, handlers.handlePostUnliked);
      socket.off(POST_EVENTS.BOOKMARKED, handlers.handlePostBookmarked);
      socket.off(POST_EVENTS.UNBOOKMARKED, handlers.handlePostUnbookmarked);
    };
  }, [socket]);
};
