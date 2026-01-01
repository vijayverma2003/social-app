"use client";

import { useState, useRef, ChangeEvent, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import uploadFilesService from "@/services/uploadService";

export interface SelectedFile {
  file: File;
  id: string;
  hash: string;
  url?: string;
  storageObjectId?: string; // StorageObject ID from PostgreSQL
}

interface UploadButtonProps {
  maxFiles?: number;
  onFilesChange?: (files: SelectedFile[]) => void;
  disabled?: boolean;
  showPreviews?: boolean;
  onUploadFilesReady?: (
    uploadFn: (files: SelectedFile[]) => Promise<SelectedFile[]>
  ) => void;
}

export const UploadButton = ({
  maxFiles = 10,
  onFilesChange,
  disabled = false,
  showPreviews = true,
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

  // Expose uploadFiles function to parent
  useEffect(() => {
    onUploadFilesReady?.(uploadFiles);
  }, [uploadFiles, onUploadFilesReady]);

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

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => {
      return prev.filter((f) => f.id !== id);
    });
  };

  // Notify parent of file changes after state update
  useEffect(() => {
    onFilesChange?.(selectedFiles);
  }, [selectedFiles, onFilesChange]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

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
      {showPreviews && selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border-b">
          {selectedFiles.map((selectedFile) => (
            <div
              key={selectedFile.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm"
            >
              <span className="truncate max-w-[200px]">
                {selectedFile.file.name}
              </span>
              <Button
                type="button"
                onClick={() => removeFile(selectedFile.id)}
                disabled={disabled}
                size="icon-sm"
                variant="ghost"
                className="h-5 w-5"
                aria-label="Remove file"
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <Button
        type="button"
        onClick={handleUploadClick}
        disabled={disabled || selectedFiles.length >= maxFiles}
        size="icon"
        variant="ghost"
        aria-label="Upload file"
        title={
          selectedFiles.length >= maxFiles
            ? `Maximum ${maxFiles} files allowed`
            : "Upload file"
        }
      >
        <Plus className="size-4" />
      </Button>
    </>
  );
};
