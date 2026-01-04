"use client";

import { Button } from "@/components/ui/button";
import { FileIcon, X } from "lucide-react";
import { SelectedFile } from "./UploadButton";
import Image from "next/image";
import { useEffect, useState } from "react";

interface MessageFilePreviewProps {
  file: SelectedFile;
  onRemove: (id: string) => void;
}

export const MessageFilePreview = ({
  file,
  onRemove,
}: MessageFilePreviewProps) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);

  useEffect(() => {
    if (file.file.type.startsWith("image/")) {
      const objectUrl = URL.createObjectURL(file.file);
      setObjectUrl(objectUrl);
      setIsImage(true);
    }
  }, [file.file]);

  return (
    <div className="flex items-center gap-2 bg-muted rounded-lg text-sm relative group overflow-hidden">
      <div className="truncate w-[200px] h-[200px] group-hover:scale-110 transition-transform group-hover:opacity-30">
        {isImage ? (
          <Image
            src={objectUrl || ""}
            alt={file.file.name}
            width={200}
            height={200}
            className="object-cover w-full h-full"
          />
        ) : (
          <FileIcon className="size-4" />
        )}
      </div>
      <Button
        type="button"
        onClick={() => onRemove(file.id)}
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
