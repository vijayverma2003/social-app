"use client";

import {
  useState,
  FormEvent,
  KeyboardEvent,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, X } from "lucide-react";
import { useMessageActions } from "../hooks/useMessageActions";
import { ChannelType, MessageData } from "@shared/schemas/messages";
import { UploadButton, SelectedFile } from "./UploadButton";
import { useUser } from "@/providers/UserContextProvider";
import { useMessagesStore } from "../store/messagesStore";
import { toast } from "sonner";

interface MessageInputProps {
  channelId: string;
  channelType: ChannelType;
  onSend?: () => void;
}

export interface MessageInputRef {
  focus: () => void;
  appendText: (text: string) => void;
}

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
      focus: () => {
        inputRef.current?.focus();
      },
      appendText: (text: string) => {
        setContent((prev) => prev + text);
        inputRef.current?.focus();
      },
    }));

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();

      const trimmedContent = content.trim();
      const hasFiles = selectedFiles.length > 0;

      // Require either content or files
      if (!trimmedContent && !hasFiles) return;

      // Check if we've reached the limit of 5 pending messages
      if (pendingMessagesRef.current.size >= 5) {
        toast.error("Please wait for previous messages to send");
        return;
      }

      if (!user) {
        toast.error("You must be logged in to send messages");
        return;
      }

      const filesToUpload = [...selectedFiles];

      // Create optimistic message immediately with files
      const optimisticMessage: Omit<MessageData, "_id"> & {
        _id: string;
        uploadingFiles?: Array<{ id: string; name: string; size: number }>;
      } = {
        _id: "", // Will be set by addOptimisticMessage
        channelId,
        channelType,
        content: trimmedContent || "",
        attachments: [], // Will be populated when files are uploaded
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: user.id,
        uploadingFiles: filesToUpload.map((f) => ({
          id: f.id,
          name: f.file.name,
          size: f.file.size,
        })),
      };

      const optimisticId = addOptimisticMessage(channelId, optimisticMessage);
      pendingMessagesRef.current.add(optimisticId);

      // Clear input immediately for better UX
      const contentToSend = trimmedContent;
      setContent("");
      // Clear file previews immediately
      setSelectedFiles([]);

      try {
        // Upload files if any
        let uploadedFiles: SelectedFile[] = [];
        if (filesToUpload.length > 0 && uploadFilesFnRef.current)
          uploadedFiles = await uploadFilesFnRef.current(filesToUpload);

        // Extract storageObjectIds from uploaded files
        const storageObjectIds = uploadedFiles
          .filter((f) => f.storageObjectId)
          .map((f) => f.storageObjectId!);

        // Check if uploads failed
        if (filesToUpload.length > 0 && storageObjectIds.length === 0) {
          console.error("All file uploads failed");
          // Mark optimistic message as error instead of removing
          pendingMessagesRef.current.delete(optimisticId);
          markMessageAsError(
            channelId,
            optimisticId,
            "Failed to upload files. Click to retry."
          );
          return;
        }

        // Update optimistic message to remove uploadingFiles and add attachments
        updateMessage(channelId, optimisticId, {
          attachments: uploadedFiles
            .filter((f) => f.url && f.storageObjectId)
            .map((f) => ({
              storageObjectId: f.storageObjectId!,
              url: f.url!,
              fileName: f.file.name,
              contentType: f.file.type || "application/octet-stream",
              size: f.file.size,
              hash: f.hash,
              storageKey: "", // Not needed for display
            })),
        } as Partial<MessageData>);

        // Send message with storageObjectIds and optimisticId
        createMessage(
          {
            channelId,
            channelType,
            content: contentToSend || "",
            storageObjectIds,
            optimisticId,
          },
          (messageId) => {
            pendingMessagesRef.current.delete(optimisticId);
            if (messageId) {
              onSend?.();
            }
          },
          optimisticId
        );
      } catch (error) {
        console.error("Error uploading files:", error);
        // Mark optimistic message as error instead of removing
        pendingMessagesRef.current.delete(optimisticId);
        markMessageAsError(
          channelId,
          optimisticId,
          "Failed to send message. Click to retry."
        );
      }

      inputRef.current?.focus();
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as any);
      }
    };

    const removeFile = (id: string) => {
      setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
    };

    return (
      <div className="bg-secondary/50 rounded-2xl">
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 border-b">
            {selectedFiles.map((selectedFile) => (
              <div
                key={selectedFile.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm"
              >
                <span className="truncate max-w-[200px]">
                  {selectedFile.file.name}
                </span>
                <Button
                  type="button"
                  onClick={() => removeFile(selectedFile.id)}
                  size="icon-sm"
                  variant="ghost"
                  className="h-5 w-5"
                  aria-label="Remove file"
                >
                  <X className="size-3" />
                </Button>
              </div>
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
