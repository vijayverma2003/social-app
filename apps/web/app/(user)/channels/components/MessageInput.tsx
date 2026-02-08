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
      content,
      setContent,
      setSelectedFiles,
      textareaRef,
      uploadFilesFnRef,
      handleSubmit,
    } = useMessageForm({ channelId, channelType, onSend });

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      appendText: (text: string) => {
        setContent((prev) => prev + text);
        textareaRef.current?.focus();
      },
    }));

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
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
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
