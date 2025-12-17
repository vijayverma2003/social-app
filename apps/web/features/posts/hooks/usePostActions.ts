"use client";

import { POST_EVENTS } from "@shared/socketEvents";
import { useSocket } from "@/providers/SocketContextProvider";
import { useCallback } from "react";
import { ClientToServerEvents } from "@shared/types/socket";
import { CreatePostPayload, PostData } from "@shared/schemas/post";
import { usePostsStore } from "../store/postsStore";
import { toast } from "sonner";

type CreatePostCallback = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.CREATE]
>[1];

type UpdatePostCallback = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.UPDATE]
>[1];

type GetFeedCallback = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.GET_FEED]
>[1];

export const usePostActions = () => {
  const { emit } = useSocket();
  const { setPosts, prependPost, updatePost } = usePostsStore();

  const createPost = useCallback(
    (payload: CreatePostPayload, onComplete?: (success: boolean) => void) => {
      emit(POST_EVENTS.CREATE, payload, ((response) => {
        if (response.error) {
          toast.error("Failed to create post", {
            description: response.error,
          });
          onComplete?.(false);
        } else if (response.success && response.data) {
          prependPost(response.data);
          toast.success("Post created successfully");
          onComplete?.(true);
        } else {
          onComplete?.(false);
        }
      }) as CreatePostCallback);
    },
    [emit, prependPost]
  );

  const getFeed = useCallback(
    (onComplete?: (posts: PostData[] | null) => void) => {
      emit(POST_EVENTS.GET_FEED, {}, ((response) => {
        if (response.error) {
          toast.error("Failed to load feed", {
            description: response.error,
          });
          onComplete?.(null);
        } else if (response.success && response.data) {
          setPosts(response.data);
          onComplete?.(response.data);
        } else {
          onComplete?.(null);
        }
      }) as GetFeedCallback);
    },
    [emit, setPosts]
  );

  return {
    createPost,
    getFeed,
  };
};
