"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMessageForm } from "@/hooks/useMessageForm";
import { ChannelType } from "@shared/schemas/messages";
import { Send } from "lucide-react";
import { forwardRef, useImperativeHandle } from "react";
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
}

export const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(
  ({ channelId, channelType, onSend }, ref) => {
    const {
      content,
      setContent,
      selectedFiles,
      setSelectedFiles,
      inputRef,
      uploadFilesFnRef,
      removeFile,
      handleSubmit,
      handleKeyDown,
    } = useMessageForm({ channelId, channelType, onSend });

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      appendText: (text: string) => {
        setContent((prev) => prev + text);
        inputRef.current?.focus();
      },
    }));

    return (
      <div className="bg-secondary/50 rounded-2xl mb-4">
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 border-b">
            {selectedFiles.map((file: SelectedFile) => (
              <MessageFilePreview
                key={file.id}
                file={file}
                onRemove={removeFile}
              />
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center p-2">
          <UploadButton
            maxFiles={10}
            onFilesChange={setSelectedFiles}
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
