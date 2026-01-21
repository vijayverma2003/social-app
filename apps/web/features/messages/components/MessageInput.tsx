"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMessageForm } from "@/hooks/useMessageForm";
import {
  ChannelType,
  CreateMessagePayloadSchema,
} from "@shared/schemas/messages";
import { Send, SendHorizonal, X } from "lucide-react";
import { forwardRef, useImperativeHandle } from "react";
import { MessageFilePreview } from "./MessageFilePreview";
import { ExistingAttachmentPreview } from "./ExistingAttachmentPreview";
import { SelectedFile, UploadButton } from "./UploadButton";
import { Textarea } from "@/components/ui/textarea";

interface MessageInputProps {
  channelId: string;
  channelType: ChannelType;
  onSend?: () => void;
}

import { Attachment } from "@shared/schemas/messages";

export interface MessageInputRef {
  focus: () => void;
  appendText: (text: string) => void;
  startEditing: (messageId: string, messageContent: string, attachments?: Attachment[]) => void;
}

export const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(
  ({ channelId, channelType, onSend }, ref) => {
    const {
      content,
      setContent,
      selectedFiles,
      setSelectedFiles,
      editingMessageId,
      existingAttachments,
      textareaRef,
      uploadFilesFnRef,
      removeFile,
      removeExistingAttachment,
      handleSubmit,
      handleKeyDown,
      startEditing,
      cancelEditing,
    } = useMessageForm({ channelId, channelType, onSend });

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      appendText: (text: string) => {
        setContent((prev) => prev + text);
        textareaRef.current?.focus();
      },
      startEditing,
    }));

    return (
      <div className="bg-secondary/70 rounded-3xl">
        {editingMessageId && (
          <div className="flex items-center justify-between px-4 py-2 bg-primary/10 border-b border-primary/20">
            <p className="text-xs text-muted-foreground">
              Editing message
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cancelEditing}
              className="h-6 px-2"
            >
              <X className="size-3" />
            </Button>
          </div>
        )}
        {/* Show existing attachments when editing */}
        {editingMessageId && existingAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2">
            {existingAttachments.map((attachment) => (
              <ExistingAttachmentPreview
                key={attachment.storageObjectId}
                attachment={attachment}
                onRemove={removeExistingAttachment}
              />
            ))}
          </div>
        )}
        {/* Show new file uploads when not editing */}
        {!editingMessageId && channelType === "dm" && selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2">
            {selectedFiles.map((file: SelectedFile) => (
              <MessageFilePreview
                key={file.id}
                file={file}
                onRemove={removeFile}
              />
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-start p-2">
          {channelType === "dm" && !editingMessageId && (
            <UploadButton
              maxFiles={10}
              onFilesChange={setSelectedFiles}
              onUploadFilesReady={(fn) => {
                uploadFilesFnRef.current = fn;
              }}
            />
          )}
          <Textarea
            ref={textareaRef}
            placeholder={editingMessageId ? "Edit message..." : "Type a message..."}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-none bg-transparent ring-0 focus-visible:ring-0 focus-visible:border-none py-2 max-h-[300px]"
            autoComplete="off"
            maxLength={1000}
          />
          <Button type="submit" size="icon" aria-label={editingMessageId ? "Save edit" : "Send message"}>
            <SendHorizonal />
          </Button>
        </form>
      </div>
    );
  }
);

MessageInput.displayName = "MessageInput";
