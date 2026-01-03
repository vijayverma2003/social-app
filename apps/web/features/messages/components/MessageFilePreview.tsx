"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { SelectedFile } from "./UploadButton";

interface MessageFilePreviewProps {
  file: SelectedFile;
  onRemove: (id: string) => void;
}

export const MessageFilePreview = ({
  file,
  onRemove,
}: MessageFilePreviewProps) => (
  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm">
    <span className="truncate max-w-[200px]">{file.file.name}</span>
    <Button
      type="button"
      onClick={() => onRemove(file.id)}
      size="icon-sm"
      variant="ghost"
      className="h-5 w-5"
      aria-label="Remove file"
    >
      <X className="size-3" />
    </Button>
  </div>
);
