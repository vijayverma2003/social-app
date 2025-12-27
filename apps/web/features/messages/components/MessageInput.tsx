"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/providers/UserContextProvider";
import { ChannelType, MessageData } from "@shared/schemas/messages";
import { Send, X } from "lucide-react";
import {
  FormEvent,
  forwardRef,
  KeyboardEvent,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { useMessageActions } from "../hooks/useMessageActions";
import { useMessagesStore } from "../store/messagesStore";
import { SelectedFile, UploadButton } from "./UploadButton";

interface MessageInputProps {
  channelId: string;
  channelType: ChannelType;
  onSend?: () => void;
}

export interface MessageInputRef {
  focus: () => void;
  appendText: (text: string) => void;
}

const MAX_PENDING_MESSAGES = 5;

// Helper: Create optimistic message data
const createOptimisticMessage = (
  channelId: string,
  channelType: ChannelType,
  content: string,
  authorId: string,
  files: SelectedFile[]
): Omit<MessageData, "_id"> & {
  _id: string;
  uploadingFiles?: Array<{ id: string; name: string; size: number }>;
} => ({
  _id: "", // Will be set by addOptimisticMessage
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

// File preview component
interface FilePreviewProps {
  file: SelectedFile;
  onRemove: (id: string) => void;
}

const FilePreview = ({ file, onRemove }: FilePreviewProps) => (
  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm">
    <span className="truncate max-w-[200px]">{file.file.name}</span>
    <Button
      type="button"
      onClick={() => onRemove(file.id)}
      size="icon-sm"
      variant="ghost"
      className="h-5 w-5"
      aria-label="Remove file"
    >
      <X className="size-3" />
    </Button>
  </div>
);

export const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(
  ({ channelId, channelType, onSend }, ref) => {
    const [content, setContent] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
    const uploadFilesFnRef = useRef<
      ((files: SelectedFile[]) => Promise<SelectedFile[]>) | null
    >(null);
    const { createMessage } = useMessageActions();
    const { addOptimisticMessage, markMessageAsError, updateMessage } =
      useMessagesStore();
    const { user } = useUser();
    const pendingMessagesRef = useRef<Set<string>>(new Set());
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      appendText: (text: string) => {
        setContent((prev) => prev + text);
        inputRef.current?.focus();
      },
    }));

    const removeFile = useCallback((id: string) => {
      setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
    }, []);

    const validateSubmission = useCallback(
      (trimmedContent: string, hasFiles: boolean): string | null => {
        if (!trimmedContent && !hasFiles) {
          return null; // Silent return - no error message needed
        }

        if (pendingMessagesRef.current.size >= MAX_PENDING_MESSAGES) {
          return "Please wait for previous messages to send";
        }

        if (!user) {
          return "You must be logged in to send messages";
        }

        return null;
      },
      [user]
    );

    const handleFileUpload = useCallback(
      async (
        files: SelectedFile[],
        optimisticId: string
      ): Promise<string[]> => {
        if (files.length === 0 || !uploadFilesFnRef.current) {
          return [];
        }

        const uploadedFiles = await uploadFilesFnRef.current(files);
        const storageObjectIds = extractStorageObjectIds(uploadedFiles);

        // Check if uploads failed
        if (files.length > 0 && storageObjectIds.length === 0) {
          pendingMessagesRef.current.delete(optimisticId);
          markMessageAsError(
            channelId,
            optimisticId,
            "Failed to upload files. Click to retry."
          );
          throw new Error("File upload failed");
        }

        // Update optimistic message with attachments
        const attachments = convertFilesToAttachments(uploadedFiles);
        updateMessage(channelId, optimisticId, {
          attachments,
        } as Partial<MessageData>);

        return storageObjectIds;
      },
      [channelId, markMessageAsError, updateMessage]
    );

    const sendMessage = useCallback(
      (
        content: string,
        storageObjectIds: string[],
        optimisticId: string
      ): void => {
        createMessage(
          {
            channelId,
            channelType,
            content: content || "",
            storageObjectIds,
            optimisticId,
          },
          (messageId) => {
            pendingMessagesRef.current.delete(optimisticId);
            if (messageId) onSend?.();
          },
          optimisticId
        );
      },
      [channelId, channelType, createMessage, onSend]
    );

    const handleSubmit = useCallback(
      async (e: FormEvent) => {
        e.preventDefault();

        const trimmedContent = content.trim();
        const hasFiles = selectedFiles.length > 0;

        // Validate submission
        const validationError = validateSubmission(trimmedContent, hasFiles);
        if (validationError) {
          toast.error(validationError);
          return;
        }

        const filesToUpload = [...selectedFiles];
        const contentToSend = trimmedContent;

        // Create optimistic message
        const optimisticMessage = createOptimisticMessage(
          channelId,
          channelType,
          contentToSend,
          user!.id,
          filesToUpload
        );

        const optimisticId = addOptimisticMessage(channelId, optimisticMessage);
        pendingMessagesRef.current.add(optimisticId);

        // Clear input immediately for better UX
        setContent("");
        setSelectedFiles([]);

        try {
          // Upload files and get storage object IDs
          const storageObjectIds = await handleFileUpload(
            filesToUpload,
            optimisticId
          );

          // Send message
          sendMessage(contentToSend, storageObjectIds, optimisticId);
        } catch (error) {
          console.error("Error sending message:", error);
          // Error already handled in handleFileUpload or needs to be handled here
          if (!pendingMessagesRef.current.has(optimisticId)) {
            // Only mark as error if not already marked
            markMessageAsError(
              channelId,
              optimisticId,
              "Failed to send message. Click to retry."
            );
          }
        }

        inputRef.current?.focus();
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
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSubmit(e as any);
        }
      },
      [handleSubmit]
    );

    return (
      <div className="bg-secondary/50 rounded-2xl">
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 border-b">
            {selectedFiles.map((file) => (
              <FilePreview key={file.id} file={file} onRemove={removeFile} />
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center p-2">
          <UploadButton
            maxFiles={10}
            onFilesChange={setSelectedFiles}
            showPreviews={false}
            onUploadFilesReady={(fn) => {
              uploadFilesFnRef.current = fn;
            }}
          />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-none bg-transparent ring-0 focus-visible:ring-0 focus-visible:border-none"
            autoComplete="off"
          />
          <Button type="submit" size="icon" aria-label="Send message">
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    );
  }
);

MessageInput.displayName = "MessageInput";
