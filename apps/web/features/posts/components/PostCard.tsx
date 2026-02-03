"use client";

import { ProfileCardPopover } from "@/app/(user)/components/ProfileCardPopover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ViewProfileButton } from "@/app/(user)/components/ViewProfileButton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useUser } from "@/providers/UserContextProvider";
import {
  bookmarkPost,
  likePost,
  removeBookmark,
  removeLike,
} from "@/services/postsService";
import { useProfilesStore } from "@/stores/profilesStore";
import { PostResponse } from "@shared/types";
import { formatDistanceToNow } from "date-fns";
import {
  Dot,
  EllipsisVerticalIcon,
  Eye,
  HeartIcon,
  MessageCircle,
  StarIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { ImageCollage } from "./ImageCollage";
import { PostDeleteDialog } from "./PostDeleteDialog";
import { Skeleton } from "@/components/ui/skeleton";

interface PostCardProps {
  post: PostResponse;
  userId: string;
  onPreviewChat?: (post: PostResponse) => void;
}

export const PostCard = ({ post, userId, onPreviewChat }: PostCardProps) => {
  const { user } = useUser();

  const profile = useProfilesStore((state) => state.getProfile(userId));
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);

  const timeAgo = useMemo(() => {
    return formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  }, [post.createdAt]);

  const displayName = profile?.displayName || "Unknown";
  const isAuthor = user?.id === post.userId;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleLike = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      const action = isLiked ? removeLike : likePost;
      const errorTitle = isLiked
        ? "Failed to remove like"
        : "Failed to like post";

      action(
        { postId: post.id },
        {
          onError: (errorMessage) => {
            toast.error(errorTitle, {
              description: errorMessage,
            });
          },
          onComplete: (updatedPost) => {
            setIsLiked(updatedPost.isLiked);
          },
        }
      ).catch(() => {
        // Error already handled via toast
      });
    },
    [post.id, isLiked]
  );

  const handleBookmark = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      const action = isBookmarked ? removeBookmark : bookmarkPost;
      const errorTitle = isBookmarked
        ? "Failed to remove bookmark"
        : "Failed to bookmark post";

      action(
        { postId: post.id },
        {
          onError: (errorMessage) => {
            toast.error(errorTitle, {
              description: errorMessage,
            });
          },
          onComplete: (updatedPost) => {
            setIsBookmarked(updatedPost.isBookmarked);
          },
        }
      ).catch(() => {
        // Error already handled via toast
      });
    },
    [post.id, isBookmarked]
  );

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setDeleteDialogOpen(true);
    },
    []
  );

  return (
    <>
      <PostDeleteDialog
        postId={post.id}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
      <div
        className="w-full max-w-2xl bg-background rounded-2xl pb-8 shadow-md shadow-background/30 group space-y-6"
      >
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <ProfileCardPopover
              align="start"
              side="top"
              userId={userId}
              className="flex items-center gap-2"
            >
              <Avatar size="lg" className="border border-foreground/40">
                <AvatarImage src={profile?.avatarURL || undefined} />
                <AvatarFallback>
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <p className="text-sm font-medium">{displayName}</p>
            </ProfileCardPopover>

            <Dot color="var(--muted-foreground)" />
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "cursor-pointer hover:text-amber-500",
                isBookmarked && "text-amber-500 bg-amber-500/10",
                "group-hover:opacity-100 opacity-0 transition-opacity duration-300"
              )}
              onClick={handleBookmark}
            >
              <StarIcon className={isBookmarked ? "fill-amber-500" : ""} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ size: "icon", variant: "ghost" }),
                  "cursor-pointer"
                )}
              >
                <EllipsisVerticalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <ViewProfileButton
                  userId={userId}
                  as="dropdown-item"
                  text="View Author"
                />
                <DropdownMenuItem onClick={handleLike}>
                  {isLiked ? "Remove Like" : "Like Post"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBookmark}>
                  {isBookmarked ? "Remove Bookmark" : "Save Post"}
                </DropdownMenuItem>
                <DropdownMenuItem>Copy Link</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPreviewChat?.(post)}>
                  Preview Chat
                </DropdownMenuItem>
                <DropdownMenuItem>Join Chat</DropdownMenuItem>

                <DropdownMenuSeparator />

                {isAuthor && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={handleDeleteClick}
                  >
                    Delete
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <div className="flex flex-col gap-4">
          {post.content && (
            <div>
              <p className="whitespace-pre-wrap wrap-break-word leading-relaxed text-base">
                {post.content}
              </p>
            </div>
          )}

          {/* Attachments */}
          {post.attachments && post.attachments.length > 0 && (
            <ImageCollage
              images={post.attachments.map((att) => ({
                id: att.id,
                url: att.storageObject.url || "",
                fileName: att.storageObject.filename,
                contentType: att.storageObject.mimeType,
                alt: att.storageObject.caption
              }))}
            />
          )}

          <div className="flex gap-1 items-center">
            <div className="*:data-[slot=avatar]:ring-background flex -space-x-3 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
              <Avatar size="sm">
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="@shadcn"
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar size="sm">
                <AvatarImage
                  src="https://github.com/maxleiter.png"
                  alt="@maxleiter"
                />
                <AvatarFallback>LR</AvatarFallback>
              </Avatar>
              <Avatar size="sm">
                <AvatarImage
                  src="https://github.com/evilrabbit.png"
                  alt="@evilrabbit"
                />
                <AvatarFallback>ER</AvatarFallback>
              </Avatar>
            </div>
            <p className="text-sm text-muted-foreground">
              Friends yapping here
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              className={cn(
                "cursor-pointer",
                isLiked ? "text-red-500 bg-red-500/10" : "hover:text-red-500"
              )}
              onClick={handleLike}
            >
              <HeartIcon className={isLiked ? "fill-red-500" : ""} />{" "}
              {post.likes ?? 0}
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={cn(
                buttonVariants({ size: "icon", variant: "secondary" }),
                "cursor-pointer"
              )}
              onClick={() => onPreviewChat?.(post)}
            >
              <Eye />
            </button>

            {post.channelId && (
              <Link
                href={`/channels/${post.id}/${post.channelId}`}
                className={cn(
                  "cursor-pointer",
                  buttonVariants({ variant: "secondary" })
                )}
              >
                <MessageCircle />
                Join
              </Link>
            )}
          </div>
        </div>
      </div>
      <div>
        <Separator />
      </div>
    </>
  );
};

export const PostCardSkeleton = () => {
  return (
    <>
      <div
        className="w-full max-w-2xl bg-background rounded-2xl pb-8 shadow-md shadow-background/30 group space-y-6"
      >
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="size-12 rounded-full" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </header>

        {/* Content */}
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/6" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>

        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-20 rounded-full" />
          <div className="flex items-center gap-1">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full" />
          </div>
        </div>
      </div>
      <div>
        <Separator />
      </div>
    </>
  );
};
