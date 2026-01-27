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
import { Separator } from "@/components/ui/separator";
import { useProfileCardViewer } from "@/contexts/profileCardViewer";
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
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { FullScreenImageCarousel } from "./FullScreenImageCarousel";
import { PostDeleteDialog } from "./PostDeleteDialog";

interface LandscapePostCardProps {
  post: PostResponse;
  userId: string;
  onPreviewChat?: (post: PostResponse) => void;
}

export const LandscapePostCard = ({
  post,
  userId,
  onPreviewChat,
}: LandscapePostCardProps) => {
  const { user } = useUser();
  const { openProfileCard } = useProfileCardViewer();

  const profile = useProfilesStore((state) => state.getProfile(userId));
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [initialImageIndex, setInitialImageIndex] = useState(0);

  const timeAgo = useMemo(() => {
    return formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  }, [post.createdAt]);

  const displayName = profile?.displayName || "Unknown";
  const isAuthor = user?.id === post.userId;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Filter to only image attachments
  const imageAttachments = useMemo(() => {
    if (!post.attachments) return [];
    return post.attachments
      .filter((att) => att.storageObject.mimeType?.startsWith("image/"))
      .map((att) => ({
        id: att.id,
        url: att.storageObject.url || "",
        fileName: att.storageObject.filename,
        contentType: att.storageObject.mimeType,
        width: null,
        height: null,
      }));
  }, [post.attachments]);

  const displayImages = imageAttachments.slice(0, 3);
  const hasMoreImages = imageAttachments.length > 3;
  const totalImages = imageAttachments.length;

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

  const handleImageClick = useCallback(
    (index: number) => {
      setInitialImageIndex(index);
      setIsCarouselOpen(true);
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
      <div className="w-full max-w-2xl bg-background rounded-2xl py-8 shadow-md shadow-background/30 group space-y-6 px-8">
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
                <DropdownMenuItem onClick={() => openProfileCard(userId)}>
                  View Author
                </DropdownMenuItem>
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
          <div className="flex gap-4 items-start">
            {/* Left: Text Content */}
            <div className="flex-1 flex flex-col gap-4">
              {post.content && (
                <div>
                  <p className="whitespace-pre-wrap wrap-break-word leading-relaxed text-base">
                    {post.content}
                  </p>
                </div>
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

            {/* Right: Stacked Images */}
            {displayImages.length > 0 && (
              <div className="relative w-32 h-32 shrink-0">
                {displayImages.map((image, index) => {
                  // Calculate rotation: each image tilted a bit more
                  const rotation = index * 8; // 0°, 8°, 16° for first 3 images
                  const zIndex = displayImages.length - index; // Higher index = higher z-index (on top)

                  return (
                    <div
                      key={image.id}
                      className={cn(
                        "absolute inset-0 transition-transform hover:scale-105",
                        hasMoreImages && "cursor-pointer"
                      )}
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        transformOrigin: "center center",
                        zIndex,
                      }}
                      onClick={() => handleImageClick(index)}
                    >
                      <div className="relative w-full h-full rounded-2xl border border-foreground/10 shadow-lg overflow-hidden">
                        <Image
                          src={image.url}
                          alt={image.fileName}
                          fill
                          className="object-cover"
                          sizes="128px"
                        />
                      </div>
                    </div>
                  );
                })}
                {/* Indicator text if more than 3 images */}
                {hasMoreImages && (
                  <div className="absolute -bottom-5 left-0 right-0 text-center">
                    <p className="text-[10px] text-muted-foreground">
                      +{totalImages - 3} more
                    </p>
                  </div>
                )}
              </div>
            )}
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
      <div className="px-8">
        <Separator />
      </div>

      {/* Full Screen Image Carousel */}

      <FullScreenImageCarousel
        images={imageAttachments}
        initialIndex={initialImageIndex}
        isOpen={isCarouselOpen}
        onClose={() => setIsCarouselOpen(false)}
      />

    </>
  );
};
