"use client";

import { PRESIGNED_URL_EVENTS } from "@shared/socketEvents";
import { useSocket } from "@/providers/SocketContextProvider";
import { useCallback } from "react";
import { ClientToServerEvents } from "@shared/types/socket";
import { GetPresignedUrlPayload } from "@shared/schemas/presignedUrl";
import { toast } from "sonner";

type GetPresignedUrlCallback = Parameters<
  ClientToServerEvents[typeof PRESIGNED_URL_EVENTS.GET]
>[1];

export const usePresignedUrl = () => {
  const { emit } = useSocket();

  const getPresignedUrl = useCallback(
    (
      payload: GetPresignedUrlPayload,
      onComplete?: (url: string | null) => void
    ) => {
      emit(PRESIGNED_URL_EVENTS.GET, payload, ((response) => {
        if (response.error) {
          toast.error("Failed to get upload URL", {
            description: response.error,
          });
          onComplete?.(null);
        } else if (response.success && response.data) {
          onComplete?.(response.data.url);
        } else {
          onComplete?.(null);
        }
      }) as GetPresignedUrlCallback);
    },
    [emit]
  );

  return {
    getPresignedUrl,
  };
};


