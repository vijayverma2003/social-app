"use client";

import { POST_EVENTS } from "@shared/socketEvents";
import { useSocket } from "@/contexts/socket";
import { useCallback } from "react";
import { ClientToServerEvents } from "@shared/types/socket";
import {
  CreatePostPayload,
  PostData,
  PostWithUser,
} from "@shared/schemas/post";
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

type GetRecentPostsCallback = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.GET_RECENT_POSTS]
>[1];

export const usePostActions = () => {
  const { emit } = useSocket();
  const { setPosts, setPostsWithUser, prependPost, updatePost } =
    usePostsStore();

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
    (onComplete?: (posts: PostWithUser[] | null) => void) => {
      emit(POST_EVENTS.GET_FEED, {}, ((response) => {
        if (response.error) {
          toast.error("Failed to load feed", {
            description: response.error,
          });
          onComplete?.(null);
        } else if (response.success && response.data) {
          // Store posts with user info for display
          setPostsWithUser(response.data);
          // Convert PostWithUser[] to PostData[] for store
          const postsData: PostData[] = response.data.map(
            ({ user, ...post }) => post
          );
          setPosts(postsData);
          onComplete?.(response.data);
        } else {
          onComplete?.(null);
        }
      }) as GetFeedCallback);
    },
    [emit, setPosts, setPostsWithUser]
  );

  const getRecentPosts = useCallback(
    (
      payload: { take?: number; offset?: number } = {},
      onComplete?: (posts: PostWithUser[] | null) => void
    ) => {
      emit(POST_EVENTS.GET_RECENT_POSTS, payload, ((response) => {
        if (response.error) {
          toast.error("Failed to load recent posts", {
            description: response.error,
          });
          onComplete?.(null);
        } else if (response.success && response.data) {
          onComplete?.(response.data);
        } else {
          onComplete?.(null);
        }
      }) as GetRecentPostsCallback);
    },
    [emit]
  );

  return {
    createPost,
    getFeed,
    getRecentPosts,
  };
};
