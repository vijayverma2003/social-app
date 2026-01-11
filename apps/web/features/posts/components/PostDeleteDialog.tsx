"use client";

import { useCallback, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deletePost } from "@/services/postsService";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, TriangleAlertIcon } from "lucide-react";

interface PostDeleteDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PostDeleteDialog = ({
  postId,
  open,
  onOpenChange,
}: PostDeleteDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = useCallback(() => {
    setIsLoading(true);
    setError(null);

    deletePost(
      { postId },
      {
        onComplete: () => {
          setIsLoading(false);
          toast.success("Post deleted successfully");
          onOpenChange(false);
        },
        onError: (errorMessage) => {
          setIsLoading(false);
          setError(errorMessage);
        },
      }
    ).catch(() => {
      // Error already handled in onError callback
      setIsLoading(false);
    });
  }, [postId, onOpenChange]);

  const handleOpenChangeInternal = useCallback(
    (newOpen: boolean) => {
      if (!isLoading) {
        onOpenChange(newOpen);
        if (!newOpen) {
          // Reset error when dialog is closed
          setError(null);
        }
      }
    },
    [isLoading, onOpenChange]
  );

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChangeInternal}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Post</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this post? This action cannot be
            undone. This will also delete the post&apos;s channel and all
            associated messages.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <Alert
            variant="destructive"
            className="rounded-2xl border-destructive/70"
          >
            <AlertCircleIcon />
            <AlertTitle>Failed to delete post.</AlertTitle>
            <AlertDescription>
              <p>{error}</p>
            </AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
