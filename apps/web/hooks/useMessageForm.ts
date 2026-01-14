"use client";

import { SelectedFile } from "@/features/messages/components/UploadButton";
import { useMessagesStore } from "@/features/messages/store/messagesStore";
import { useUser } from "@/providers/UserContextProvider";
import { createMessage } from "@/services/messagesService";
import { ChannelType, MessageData } from "@shared/schemas/messages";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

const MAX_PENDING_MESSAGES = 5;
const ERROR_SEND_MESSAGE = "Failed to send message. Click to retry.";
const ERROR_UPLOAD_FILES = "Failed to upload files, retry again.";

// Helper: Create optimistic message data
const createOptimisticMessage = (
  channelId: string,
  channelType: ChannelType,
  content: string,
  authorId: string,
  files: SelectedFile[]
): Omit<MessageData, "id"> & {
  id: string;
  uploadingFiles?: Array<{ id: string; name: string; size: number }>;
} => ({
  id: "", // Will be set by addOptimisticMessage
  channelId,
  channelType,
  content: content || "",
  attachments: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  authorId,
  uploadingFiles: files.map((f) => ({
    id: f.id,
    name: f.file.name,
    size: f.file.size,
  })),
});

// Helper: Convert uploaded files to message attachments
const convertFilesToAttachments = (
  files: SelectedFile[]
): MessageData["attachments"] => {
  return files
    .filter((f) => f.url && f.storageObjectId)
    .map((f) => ({
      storageObjectId: f.storageObjectId!,
      url: f.url!,
      fileName: f.file.name,
      contentType: f.file.type || "application/octet-stream",
      size: f.file.size,
      hash: f.hash,
      storageKey: "", // Not needed for display
    }));
};

// Helper: Extract storage object IDs from uploaded files
const extractStorageObjectIds = (files: SelectedFile[]): string[] => {
  return files.filter((f) => f.storageObjectId).map((f) => f.storageObjectId!);
};

interface UseMessageFormProps {
  channelId: string;
  channelType: ChannelType;
  onSend?: () => void;
}

export const useMessageForm = ({
  channelId,
  channelType,
  onSend,
}: UseMessageFormProps) => {
  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const uploadFilesFnRef = useRef<
    ((files: SelectedFile[]) => Promise<SelectedFile[]>) | null
  >(null);
  const pendingMessagesRef = useRef<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { addOptimisticMessage, markMessageAsError, updateMessage } =
    useMessagesStore();
  const { user } = useUser();

  const removeFile = useCallback((id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Wrapper for setSelectedFiles that prevents file selection for post channels
  const setSelectedFilesSafe = useCallback(
    (files: SelectedFile[] | ((prev: SelectedFile[]) => SelectedFile[])) => {
      if (channelType === "post") {
        // Silently ignore file selection for post channels
        return;
      }
      setSelectedFiles(files);
    },
    [channelType]
  );

  const validateSubmission = useCallback(
    (messageContent: string, hasAttachments: boolean): string | null => {
      if (!messageContent && !hasAttachments) return null;

      if (pendingMessagesRef.current.size >= MAX_PENDING_MESSAGES)
        return "Please wait for previous messages to send";

      if (!user) return "You must be logged in to send messages";

      // Prevent attachments for post channels
      if (channelType === "post" && hasAttachments) {
        return "File attachments are not allowed in post channels";
      }

      return null;
    },
    [user, channelType]
  );

  const handleFileUpload = useCallback(
    async (files: SelectedFile[], optimisticId: string): Promise<string[]> => {
      // Prevent file uploads for post channels
      if (channelType === "post" && files.length > 0) {
        throw new Error("File attachments are not allowed in post channels");
      }

      if (files.length === 0 || !uploadFilesFnRef.current) {
        return [];
      }

      const uploadedFiles = await uploadFilesFnRef.current(files);
      const storageObjectIds = extractStorageObjectIds(uploadedFiles);

      // Check if uploads failed
      if (files.length > 0 && storageObjectIds.length === 0) {
        pendingMessagesRef.current.delete(optimisticId);
        markMessageAsError(channelId, optimisticId, ERROR_UPLOAD_FILES);
        throw new Error(ERROR_UPLOAD_FILES);
      }

      // Update optimistic message with attachments
      const attachments = convertFilesToAttachments(uploadedFiles);
      updateMessage(channelId, optimisticId, { attachments });

      return storageObjectIds;
    },
    [channelId, channelType, markMessageAsError, updateMessage]
  );

  const sendMessage = useCallback(
    (
      content: string,
      storageObjectIds: string[],
      optimisticId: string
    ): void => {
      const onComplete = (messageId: string | null) => {
        pendingMessagesRef.current.delete(optimisticId);
        if (messageId) onSend?.();
      };

      const payload = {
        channelId,
        channelType,
        content,
        storageObjectIds,
        optimisticId,
      };

      createMessage(payload, { onComplete, optimisticId });
    },
    [channelId, channelType, onSend]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const messageContent = content.trim();
      const attachments = [...selectedFiles];
      const hasAttachments = attachments.length > 0;

      // Validate submission
      const validationError = validateSubmission(
        messageContent,
        hasAttachments
      );

      if (validationError) return toast.error(validationError);

      // Create optimistic message
      const optimisticMessage = createOptimisticMessage(
        channelId,
        channelType,
        messageContent,
        user!.id,
        attachments
      );

      const optimisticId = addOptimisticMessage(channelId, optimisticMessage);
      pendingMessagesRef.current.add(optimisticId);

      // Clear input immediately for better UX
      setContent("");
      setSelectedFiles([]);

      try {
        // Upload files and get storage object IDs
        const storageObjectIds = await handleFileUpload(
          attachments,
          optimisticId
        );

        // Send message
        sendMessage(messageContent, storageObjectIds, optimisticId);
      } catch (error) {
        console.error("Error sending message:", error);
        pendingMessagesRef.current.delete(optimisticId);
        markMessageAsError(channelId, optimisticId, ERROR_SEND_MESSAGE);
      }

      textareaRef.current?.focus();
    },
    [
      content,
      selectedFiles,
      validateSubmission,
      channelId,
      channelType,
      user,
      addOptimisticMessage,
      handleFileUpload,
      sendMessage,
      markMessageAsError,
    ]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as any);
      }
    },
    [handleSubmit]
  );

  return {
    // State
    content,
    setContent,
    selectedFiles,
    setSelectedFiles: setSelectedFilesSafe,
    // Refs
    textareaRef,
    uploadFilesFnRef,
    // Handlers
    removeFile,
    handleSubmit,
    handleKeyDown,
  };
};
