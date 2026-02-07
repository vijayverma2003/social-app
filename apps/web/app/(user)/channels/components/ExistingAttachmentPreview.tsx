"use client";

import { Button } from "@/components/ui/button";
import { FileIcon, X } from "lucide-react";
import { Attachment } from "@shared/schemas/messages";
import Image from "next/image";

interface ExistingAttachmentPreviewProps {
  attachment: Attachment;
  onRemove: (storageObjectId: string) => void;
}

export const ExistingAttachmentPreview = ({
  attachment,
  onRemove,
}: ExistingAttachmentPreviewProps) => {
  const isImage = attachment.contentType?.startsWith("image/") ?? false;

  return (
    <div className="flex items-center gap-2 bg-muted rounded-lg text-sm relative group overflow-hidden">
      <div className="truncate w-[150px] h-[150px] transition-opacity group-hover:opacity-30 duration-300 rounded-2xl overflow-hidden">
        {isImage ? (
          <Image
            src={attachment.url}
            alt={attachment.fileName}
            width={150}
            height={150}
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
        onClick={() => onRemove(attachment.storageObjectId)}
        size="icon-sm"
        variant="destructive"
        className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        aria-label="Remove attachment"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
};
