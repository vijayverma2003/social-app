"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMessageForm } from "@/hooks/useMessageForm";
import { useProfilesStore } from "@/stores/profilesStore";
import { ChannelType } from "@shared/schemas/messages";
import { SendHorizonal, X } from "lucide-react";
import { forwardRef, useCallback, useImperativeHandle } from "react";
import { UploadButton } from "./UploadButton";
import type { OptimistcMessageData } from "@/stores/messagesStore";

interface MessageInputProps {
  channelId: string;
  channelType: ChannelType;
}

export interface MessageInputRef {
  focus: () => void;
  appendText: (text: string) => void;
  startReply: (
    message: OptimistcMessageData,
  ) => void;
}

export const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(
  ({ channelId, channelType }, ref) => {
    const {
      form,
      content,
      setSelectedFiles,
      textareaRef,
      uploadFilesFnRef,
      handleSubmit,
      replyingToMessage,
      startReply,
      cancelReply,
    } = useMessageForm({ channelId, channelType });

    const repliedToProfile = useProfilesStore((state) =>
      replyingToMessage ? state.getProfile(replyingToMessage.authorId) : null,
    );

    useImperativeHandle(
      ref,
      () => ({
        focus: () => textareaRef.current?.focus(),
        appendText: (text: string) => {
          form.setValue("content", form.getValues("content") + text);
          textareaRef.current?.focus();
        },
        startReply,
      }),
      [form, textareaRef, startReply],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSubmit(e as any);
        }
      },
      [handleSubmit],
    );

    return (
      <div className="bg-secondary rounded-3xl">
        {replyingToMessage && (
          <div className="flex items-center justify-between px-4 py-2 bg-primary/10 border-b border-primary/20 rounded-t-3xl">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <p className="text-xs text-muted-foreground shrink-0">
                Replying to
              </p>
              <p className="text-xs font-medium text-primary shrink-0">
                {repliedToProfile?.displayName ?? "Unknown"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {replyingToMessage.content.slice(0, 80)}
                {replyingToMessage.content.length > 80 ? "…" : ""}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cancelReply}
              className="h-6 px-2"
              aria-label="Cancel reply"
            >
              <X className="size-3" />
            </Button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex items-start p-2">
          {channelType === "dm" && (
            <UploadButton
              maxFiles={10}
              onFilesChange={setSelectedFiles}
              onUploadFilesReady={(fn) => {
                uploadFilesFnRef.current = fn;
              }}
            />
          )}
          <Textarea
            name="content"
            value={content}
            onChange={(e) => form.setValue("content", e.target.value)}
            ref={textareaRef}
            onKeyDown={handleKeyDown}
            className="flex-1 border-none bg-transparent ring-0 focus-visible:ring-0 focus-visible:border-none py-2 max-h-[300px]"
            autoComplete="off"
            maxLength={1000}
          />
          <Button type="submit" size="icon" aria-label="Send message">
            <SendHorizonal />
          </Button>
        </form>
      </div>
    );
  },
);

MessageInput.displayName = "MessageInput";
