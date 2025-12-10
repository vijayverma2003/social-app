"use client";

import { UPLOAD_EVENTS } from "@shared/socketEvents";
import { useSocket } from "@/providers/SocketContextProvider";
import { useCallback, useEffect } from "react";
import { ClientToServerEvents, ServerToClientEvents } from "@shared/types/socket";
import {
  UploadInitPayload,
  UploadCompletePayload,
  UploadInitialisedResponse,
  UploadCompletedResponse,
} from "@shared/schemas/fileAttachment";
import { toast } from "sonner";

type UploadInitCallback = Parameters<
  ClientToServerEvents[typeof UPLOAD_EVENTS.INIT]
>[1];

type UploadCompleteCallback = Parameters<
  ClientToServerEvents[typeof UPLOAD_EVENTS.COMPLETE]
>[1];

export interface UploadProgress {
  attachmentId: string;
  fileName: string;
  status: "initializing" | "uploading" | "verifying" | "done" | "failed";
  error?: string;
  url?: string;
}

export const useUploadActions = () => {
  const { emit, socket } = useSocket();

  const initUpload = useCallback(
    (
      payload: UploadInitPayload,
      onComplete?: (data: UploadInitialisedResponse | null) => void
    ) => {
      emit(UPLOAD_EVENTS.INIT, payload, ((response) => {
        if (response.error) {
          toast.error("Failed to initialize upload", {
            description: response.error,
          });
          onComplete?.(null);
        } else if (response.success && response.data) {
          onComplete?.(response.data);
        } else {
          onComplete?.(null);
        }
      }) as UploadInitCallback);
    },
    [emit]
  );

  const completeUpload = useCallback(
    (
      payload: UploadCompletePayload,
      onComplete?: (data: UploadCompletedResponse | null) => void
    ) => {
      emit(UPLOAD_EVENTS.COMPLETE, payload, ((response) => {
        if (response.error) {
          toast.error("Failed to complete upload", {
            description: response.error,
          });
          onComplete?.(null);
        } else if (response.success && response.data) {
          onComplete?.(response.data);
        } else {
          onComplete?.(null);
        }
      }) as UploadCompleteCallback);
    },
    [emit]
  );

  // Listen for server-initiated events
  const useUploadEvents = useCallback(
    (
      onInitialised?: (data: UploadInitialisedResponse) => void,
      onCompleted?: (data: UploadCompletedResponse) => void
    ) => {
      useEffect(() => {
        if (!socket) return;

        const handleInitialised: ServerToClientEvents[typeof UPLOAD_EVENTS.INITIALISED] =
          (data) => {
            onInitialised?.(data);
          };

        const handleCompleted: ServerToClientEvents[typeof UPLOAD_EVENTS.COMPLETED] =
          (data) => {
            onCompleted?.(data);
          };

        socket.on(UPLOAD_EVENTS.INITIALISED, handleInitialised);
        socket.on(UPLOAD_EVENTS.COMPLETED, handleCompleted);

        return () => {
          socket.off(UPLOAD_EVENTS.INITIALISED, handleInitialised);
          socket.off(UPLOAD_EVENTS.COMPLETED, handleCompleted);
        };
      }, [socket, onInitialised, onCompleted]);
    },
    [socket]
  );

  return {
    initUpload,
    completeUpload,
    useUploadEvents,
  };
};

