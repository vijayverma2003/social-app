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
    const [isSending, setIsSending] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(false);
    const uploadFilesFnRef = useRef<
      ((files: SelectedFile[]) => Promise<SelectedFile[]>) | null
    >(null);
    const { createMessage } = useMessageActions();
    const { addOptimisticMessage } = useMessagesStore();
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
      if ((!trimmedContent && !hasFiles) || isSending || isUploading) return;

      // Check if we've reached the limit of 5 pending messages
      if (pendingMessagesRef.current.size >= 5) {
        toast.error("Please wait for previous messages to send");
        return;
      }

      if (!user) {
        toast.error("You must be logged in to send messages");
        return;
      }

      // Create optimistic message immediately
      const optimisticMessage: Omit<MessageData, "_id"> & { _id: string } = {
        _id: "", // Will be set by addOptimisticMessage
        channelId,
        channelType,
        content: trimmedContent || "",
        attachments: [], // Will be populated when files are uploaded
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: user.id,
      };

      const optimisticId = addOptimisticMessage(channelId, optimisticMessage);
      pendingMessagesRef.current.add(optimisticId);

      // Clear input immediately for better UX
      const contentToSend = trimmedContent;
      setContent("");

      setIsSending(true);
      setUploadError(false);
      
      if (hasFiles) setIsUploading(true);
      // Clear file previews immediately
      const filesToUpload = [...selectedFiles];
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
          setUploadError(true);
          setIsUploading(false);
          setIsSending(false);
          // Remove optimistic message on upload failure
          pendingMessagesRef.current.delete(optimisticId);
          useMessagesStore.getState().removeMessage(channelId, optimisticId);
          return;
        }

        // Send message with storageObjectIds
        createMessage(
          {
            channelId,
            channelType,
            content: contentToSend || "",
            storageObjectIds,
          },
          (messageId) => {
            pendingMessagesRef.current.delete(optimisticId);
            setIsUploading(false);
            setIsSending(false);
            if (messageId) {
              setUploadError(false);
              onSend?.();
            }
          },
          optimisticId
        );
      } catch (error) {
        console.error("Error uploading files:", error);
        setUploadError(true);
        setIsUploading(false);
        setIsSending(false);
        // Remove optimistic message on error
        pendingMessagesRef.current.delete(optimisticId);
        useMessagesStore.getState().removeMessage(channelId, optimisticId);
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
                  disabled={isSending || isUploading}
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
        {isUploading && (
          <div className="px-4 py-2 border-b text-sm text-muted-foreground">
            Uploading... files
          </div>
        )}
        {uploadError && (
          <div className="px-4 py-2 border-b text-sm text-destructive">
            An error occurred while uploading files
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center p-2">
          <UploadButton
            maxFiles={10}
            onFilesChange={setSelectedFiles}
            disabled={isSending || isUploading}
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
            disabled={isSending || isUploading}
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
