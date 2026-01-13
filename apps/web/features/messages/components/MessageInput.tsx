"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMessageForm } from "@/hooks/useMessageForm";
import {
  ChannelType,
  CreateMessagePayloadSchema,
} from "@shared/schemas/messages";
import { Send, SendHorizonal } from "lucide-react";
import { forwardRef, useImperativeHandle } from "react";
import { MessageFilePreview } from "./MessageFilePreview";
import { SelectedFile, UploadButton } from "./UploadButton";
import { Textarea } from "@/components/ui/textarea";

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
      selectedFiles,
      setSelectedFiles,
      textareaRef,
      uploadFilesFnRef,
      removeFile,
      handleSubmit,
      handleKeyDown,
    } = useMessageForm({ channelId, channelType, onSend });

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      appendText: (text: string) => {
        setContent((prev) => prev + text);
        textareaRef.current?.focus();
      },
    }));

    return (
      <div className="bg-secondary/70 rounded-3xl">
        {selectedFiles.length > 0 && (
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
          <UploadButton
            maxFiles={10}
            onFilesChange={setSelectedFiles}
            onUploadFilesReady={(fn) => {
              uploadFilesFnRef.current = fn;
            }}
          />
          <Textarea
            ref={textareaRef}
            placeholder="Type a message..."
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
  }
);

MessageInput.displayName = "MessageInput";
