"use client";

import { POST_EVENTS } from "@shared/socketEvents";
import { useSocket } from "@/providers/SocketContextProvider";
import { useCallback } from "react";
import { ClientToServerEvents } from "@shared/types/socket";
import { CreatePostPayload } from "@shared/schemas/post";
import { toast } from "sonner";

type CreatePostCallback = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.CREATE]
>[1];

type UpdatePostCallback = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.UPDATE]
>[1];

export const usePostActions = () => {
  const { emit } = useSocket();

  const createPost = useCallback(
    (
      payload: CreatePostPayload,
      onComplete?: (success: boolean) => void
    ) => {
      emit(POST_EVENTS.CREATE, payload, ((response) => {
        if (response.error) {
          toast.error("Failed to create post", {
            description: response.error,
          });
          onComplete?.(false);
        } else if (response.success && response.data) {
          toast.success("Post created successfully");
          onComplete?.(true);
        } else {
          onComplete?.(false);
        }
      }) as CreatePostCallback);
    },
    [emit]
  );

  return {
    createPost,
  };
};

