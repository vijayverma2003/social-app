"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OptimistcMessageData } from "@/stores/messagesStore";
import { useMessageForm } from "@/hooks/useMessageForm";
import { useProfilesStore } from "@/stores/profilesStore";
import {
  Attachment,
  ChannelType
} from "@shared/schemas/messages";
import { SendHorizonal, X } from "lucide-react";
import { forwardRef, useImperativeHandle } from "react";
import { ExistingAttachmentPreview } from "./ExistingAttachmentPreview";
import { MessageFilePreview } from "./MessageFilePreview";
import { SelectedFile, UploadButton } from "./UploadButton";

interface MessageInputProps {
  channelId: string;
  channelType: ChannelType;
  onSend?: () => void;
}


export interface MessageInputRef {
  focus: () => void;
  appendText: (text: string) => void;
  startEditing: (messageId: string, messageContent: string, attachments?: Attachment[]) => void;
  startReply: (message: OptimistcMessageData) => void;
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
      replyingToMessage,
      textareaRef,
      uploadFilesFnRef,
      removeFile,
      removeExistingAttachment,
      handleSubmit,
      handleKeyDown,
      startEditing,
      cancelEditing,
      startReply,
      cancelReply,
    } = useMessageForm({ channelId, channelType, onSend });

    const repliedToProfile = useProfilesStore((state) =>
      replyingToMessage ? state.getProfile(replyingToMessage.authorId) : null
    );

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      appendText: (text: string) => {
        setContent((prev) => prev + text);
        textareaRef.current?.focus();
      },
      startEditing,
      startReply,
    }));

    return (
      <div className="bg-secondary rounded-3xl">
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
        {replyingToMessage && (
          <div className="flex items-center justify-between px-4 py-2 bg-primary/10 border-b border-primary/20">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <p className="text-xs text-muted-foreground shrink-0">Replying to</p>
              <p className="text-xs font-medium text-primary shrink-0">
                {repliedToProfile?.displayName || "Unknown User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {replyingToMessage.content.slice(0, 100)}...
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cancelReply}
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
            placeholder={
              editingMessageId
                ? "Edit message..."
                : replyingToMessage
                  ? "Type a reply..."
                  : "Type a message..."
            }
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
