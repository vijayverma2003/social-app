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
import { ChannelType, Attachment } from "@shared/schemas/messages";
import { UploadButton, SelectedFile } from "./UploadButton";

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

      setIsSending(true);
      setIsUploading(true);
      setUploadError(false);

      // Clear file previews immediately
      const filesToUpload = [...selectedFiles];
      setSelectedFiles([]);

      try {
        // Upload files if any
        let uploadedFiles: SelectedFile[] = [];
        if (filesToUpload.length > 0 && uploadFilesFnRef.current)
          uploadedFiles = await uploadFilesFnRef.current(filesToUpload);

        // Convert uploaded files to attachments
        const attachments: Attachment[] = uploadedFiles
          .filter((f) => f.url)
          .map((f) => ({
            url: f.url!,
            fileName: f.file.name,
            contentType: f.file.type || "application/octet-stream",
            size: f.file.size,
          }));

        // Check if uploads failed
        if (filesToUpload.length > 0 && attachments.length === 0) {
          console.error("All file uploads failed");
          setUploadError(true);
          setIsUploading(false);
          setIsSending(false);
          return;
        }

        // Send message with attachments
        createMessage(
          {
            channelId,
            channelType,
            content: trimmedContent || "",
            attachments,
          },
          (messageId) => {
            setIsUploading(false);
            setIsSending(false);
            if (messageId) {
              setContent("");
              setUploadError(false);
              onSend?.();
            }
          }
        );
      } catch (error) {
        console.error("Error uploading files:", error);
        setUploadError(true);
        setIsUploading(false);
        setIsSending(false);
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

    const hasContentOrFiles = content.trim() || selectedFiles.length > 0;

    return (
      <div className="border-t bg-background">
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
        <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4">
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
            className="flex-1"
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={!hasContentOrFiles || isSending || isUploading}
            size="icon"
            aria-label="Send message"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    );
  }
);

MessageInput.displayName = "MessageInput";
