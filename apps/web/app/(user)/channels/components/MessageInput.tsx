"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMessageForm } from "@/hooks/useMessageForm";
import { ChannelType } from "@shared/schemas/messages";
import { SendHorizonal } from "lucide-react";
import { forwardRef, useCallback, useImperativeHandle } from "react";
import { UploadButton } from "./UploadButton";

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
    const {
      form,
      content,
      setSelectedFiles,
      textareaRef,
      uploadFilesFnRef,
      handleSubmit,
    } = useMessageForm({ channelId, channelType, onSend });

    useImperativeHandle(
      ref,
      () => ({
        focus: () => textareaRef.current?.focus(),
        appendText: (text: string) => {
          form.setValue("content", form.getValues("content") + text);
          textareaRef.current?.focus();
        },
      }),
      [form, textareaRef],
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
