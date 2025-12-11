"use client";

import { useState, useRef, ChangeEvent, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useUploadActions } from "../hooks/useUploadActions";
import { toast } from "sonner";

// Helper function to calculate SHA256 hash
const calculateFileHash = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
};

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
  const { initUpload, completeUpload } = useUploadActions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload files function - exposed to parent
  const uploadFiles = useCallback(
    async (files: SelectedFile[]): Promise<SelectedFile[]> => {
      if (files.length === 0) return [];

      // Upload all files in parallel
      const uploadPromises = files.map(async (selectedFile) => {
        return new Promise<SelectedFile>((resolveFile, rejectFile) => {
          // Initialize upload
          initUpload(
            {
              fileName: selectedFile.file.name,
              contentType: selectedFile.file.type || "application/octet-stream",
              size: selectedFile.file.size,
              hash: selectedFile.hash,
            },
            async (response) => {
              if (!response) {
                console.error(
                  "Failed to initialize upload for file:",
                  selectedFile.file.name
                );
                rejectFile(new Error("Failed to initialize upload"));
                return;
              }

              try {
                // If file already exists, we have url, no need to upload
                if (response.url) {
                  const doneFile: SelectedFile = {
                    ...selectedFile,
                    url: response.url,
                    storageObjectId: response.storageObjectId,
                  };
                  resolveFile(doneFile);
                  return;
                }

                // File needs to be uploaded - upload to R2 using presigned URL
                if (!response.presignedUrl || !response.storageObjectId)
                  throw new Error("Missing presigned URL or storage object ID");

                const uploadResponse = await fetch(response.presignedUrl, {
                  method: "PUT",
                  body: selectedFile.file,
                  headers: {
                    "Content-Type":
                      selectedFile.file.type || "application/octet-stream",
                  },
                });

                if (!uploadResponse.ok) {
                  console.error(
                    "Failed to upload file:",
                    selectedFile.file.name,
                    uploadResponse.statusText
                  );
                  throw new Error("Failed to upload file");
                }

                // Complete upload (verify hash)
                completeUpload(
                  {
                    storageObjectId: response.storageObjectId,
                    hash: selectedFile.hash,
                  },
                  (completeResponse) => {
                    if (!completeResponse) {
                      console.error(
                        "Hash verification failed for file:",
                        selectedFile.file.name
                      );
                      rejectFile(new Error("Hash verification failed"));
                      return;
                    }

                    const doneFile: SelectedFile = {
                      ...selectedFile,
                      url: completeResponse.url,
                      storageObjectId: completeResponse.storageObjectId,
                    };
                    resolveFile(doneFile);
                  }
                );
              } catch (error) {
                console.error(
                  "Error uploading file:",
                  selectedFile.file.name,
                  error
                );
                rejectFile(error);
              }
            }
          );
        });
      });

      try {
        const results = await Promise.all(uploadPromises);
        return results;
      } catch (error) {
        console.error("Error uploading files:", error);
        throw error;
      }
    },
    [initUpload, completeUpload]
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
        const hash = await calculateFileHash(file);
        return {
          file,
          id: `${Date.now()}-${Math.random()}`,
          hash,
        };
      })
    );

    setSelectedFiles((prev) => {
      const updated = [...prev, ...newFiles];
      onFilesChange?.(updated);
      return updated;
    });

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      onFilesChange?.(updated);
      return updated;
    });
  };

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
