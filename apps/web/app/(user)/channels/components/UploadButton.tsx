"use client";

import { Button } from "@/components/ui/button";
import uploadFilesService from "@/services/uploadService";
import { Plus } from "lucide-react";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export interface SelectedFile {
  file: File;
  id: string;
  hash: string;
  url?: string;
  storageObjectId?: string; // StorageObject ID from PostgreSQL
}

interface UploadButtonProps {
  buttonText?: string;
  maxFiles?: number;
  onFilesChange?: (files: SelectedFile[]) => void;
  disabled?: boolean;
  onUploadFilesReady?: (
    uploadFn: (files: SelectedFile[]) => Promise<SelectedFile[]>
  ) => void;
}

export const UploadButton = ({
  buttonText,
  maxFiles = 10,
  onFilesChange,
  disabled = false,
  onUploadFilesReady,
}: UploadButtonProps) => {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload files function - exposed to parent
  const uploadFiles = useCallback(
    async (files: SelectedFile[]): Promise<SelectedFile[]> => {
      if (files.length === 0) return [];

      try {
        const fileArray = files.map((selectedFile) => selectedFile.file);
        const results = await uploadFilesService.uploadFiles(fileArray);

        const uploadedFiles: SelectedFile[] = results.map((result, index) => {
          const originalFile = files[index];
          return {
            ...originalFile,
            url: result.url,
            storageObjectId: result.storageObjectId,
          };
        });

        return uploadedFiles;
      } catch (error) {
        console.error("Error uploading files:", error);
        toast.error("Failed to upload files", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
        throw error;
      }
    },
    []
  );

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    const totalFiles = selectedFiles.length + files.length;
    if (totalFiles > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`, {
        description: `You can only upload up to ${maxFiles} files. You currently have ${selectedFiles.length} file(s) selected.`,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Calculate hash for each file and add to selected files
    const newFiles: SelectedFile[] = await Promise.all(
      files.map(async (file) => {
        const hash = await uploadFilesService.calculateFileHash(file);
        return {
          file,
          id: `${Date.now()}-${Math.random()}`,
          hash,
        };
      })
    );

    setSelectedFiles((prev) => {
      return [...prev, ...newFiles];
    });

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Expose uploadFiles function to parent
  useEffect(() => {
    onUploadFilesReady?.(uploadFiles);
  }, [uploadFiles, onUploadFilesReady]);

  // Notify parent of file changes after state update
  useEffect(() => {
    onFilesChange?.(selectedFiles);
  }, [selectedFiles, onFilesChange]);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled}
        accept="*/*"
        multiple
      />
      <Button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || selectedFiles.length >= maxFiles}
        size={buttonText ? "default" : "icon"}
        variant={buttonText ? "default" : "ghost"}
        aria-label="Upload file"
        title={
          selectedFiles.length >= maxFiles
            ? `Maximum ${maxFiles} files allowed`
            : "Upload file"
        }
      >
        {buttonText ? buttonText : <Plus className="size-4" />}
      </Button>
    </>
  );
};
