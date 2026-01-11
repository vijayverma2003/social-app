"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { CreatePostPayloadSchema } from "@shared/schemas";
import { CreatePostPayload, PostResponse } from "@shared/types";

import {
  UploadButton,
  SelectedFile,
} from "@/features/messages/components/UploadButton";
import { createPost } from "@/services/postsService";

interface CreatePostFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CreatePostForm = ({
  onSuccess,
  onCancel,
}: CreatePostFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const uploadFilesFnRef = useRef<
    ((files: SelectedFile[]) => Promise<SelectedFile[]>) | null
  >(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreatePostPayload>({
    resolver: zodResolver(CreatePostPayloadSchema),
    defaultValues: {
      content: "",
      storageObjectIds: [],
    },
  });

  const content = watch("content");

  const onSubmit = async (data: CreatePostPayload) => {
    const trimmedContent = data.content.trim();
    const hasFiles = selectedFiles.length > 0;

    // Require either content or files
    if (!trimmedContent && !hasFiles) {
      return;
    }

    setIsSubmitting(true);
    setIsUploading(true);

    // Clear file previews immediately
    const filesToUpload = [...selectedFiles];
    setSelectedFiles([]);

    try {
      // Upload files if any
      let uploadedFiles: SelectedFile[] = [];
      if (filesToUpload.length > 0 && uploadFilesFnRef.current) {
        uploadedFiles = await uploadFilesFnRef.current(filesToUpload);
      }

      // Extract storageObjectIds from uploaded files
      const storageObjectIds = uploadedFiles
        .filter((f) => f.storageObjectId)
        .map((f) => f.storageObjectId!);

      // Check if uploads failed
      if (filesToUpload.length > 0 && storageObjectIds.length === 0) {
        console.error("All file uploads failed");
        setIsUploading(false);
        setIsSubmitting(false);
        return;
      }

      const onComplete = (post: PostResponse) => {
        setIsUploading(false);
        setIsSubmitting(false);
        if (post) {
          reset();
          setSelectedFiles([]);
          onSuccess?.();
        }
      };

      // Create post with storageObjectIds
      createPost(
        {
          content: trimmedContent || "",
          storageObjectIds,
        },
        { onComplete }
      );
    } catch (error) {
      console.error("Error uploading files:", error);
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const hasContentOrFiles = content.trim() || selectedFiles.length > 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="content">What's on your mind?</Label>
        <Textarea
          id="content"
          {...register("content")}
          placeholder="Share your thoughts..."
          disabled={isSubmitting || isUploading}
          rows={4}
          className="resize-none"
        />
        {errors.content && (
          <p className="text-sm text-destructive">{errors.content.message}</p>
        )}
        {errors.storageObjectIds && (
          <p className="text-sm text-destructive">
            {errors.storageObjectIds.message}
          </p>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
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
                disabled={isSubmitting || isUploading}
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

      {isUploading && (
        <div className="text-sm text-muted-foreground">Uploading files...</div>
      )}

      <div className="flex items-center justify-between gap-2">
        <UploadButton
          maxFiles={10}
          onFilesChange={setSelectedFiles}
          disabled={isSubmitting || isUploading}
          onUploadFilesReady={(fn) => {
            uploadFilesFnRef.current = fn;
          }}
        />
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || isUploading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={!hasContentOrFiles || isSubmitting || isUploading}
          >
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>
    </form>
  );
};
