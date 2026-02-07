"use client";

import { Button } from "@/components/ui/button";
import { FileIcon, X } from "lucide-react";
import { SelectedFile } from "@/app/(user)/channels/components/UploadButton";
import Image from "next/image";
import { useEffect, useState } from "react";

interface PostAttachmentPreviewProps {
  file: SelectedFile;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export const PostAttachmentPreview = ({
  file,
  onRemove,
  disabled = false,
}: PostAttachmentPreviewProps) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);

  useEffect(() => {
    if (file.file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file.file);
      setObjectUrl(url);
      setIsImage(true);

      // Cleanup object URL on unmount or when file changes
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setIsImage(false);
      setObjectUrl(null);
    }
  }, [file.file]);

  return (
    <div className="flex items-center gap-2 bg-muted rounded-lg text-sm relative group overflow-hidden shrink-0">
      <div className="truncate w-[100px] h-[100px] transition-opacity group-hover:opacity-30 duration-300 rounded-2xl overflow-hidden">
        {isImage ? (
          <Image
            src={objectUrl || ""}
            alt={file.file.name}
            width={100}
            height={100}
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <FileIcon className="size-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <Button
        type="button"
        onClick={() => onRemove(file.id)}
        disabled={disabled}
        size="icon-sm"
        variant="destructive"
        className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        aria-label="Remove file"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
};
