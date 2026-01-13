"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useUser } from "@/providers/UserContextProvider";
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
import { useMemo, useState, useCallback } from "react";
import { ImageCollage } from "./ImageCollage";
import { PostDeleteDialog } from "./PostDeleteDialog";
import { Separator } from "@/components/ui/separator";
import { ProfileCardPopover } from "@/app/(user)/settings/profile/components/ProfileCardPopover";
import { ProfileCardDialog } from "@/app/(user)/settings/profile/components/ProfileCardDialog";

interface PostCardProps {
  post: PostResponse;
  userId: string;
  onPreviewChat?: (post: PostResponse) => void;
}

export const PostCard = ({ post, userId, onPreviewChat }: PostCardProps) => {
  const { user } = useUser();
  const profile = useProfilesStore((state) => state.getProfile(userId));

  const timeAgo = useMemo(() => {
    return formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  }, [post.createdAt]);

  const displayName = profile?.displayName || "Unknown";
  const isLiked = false; // TODO: Implement like functionality
  const isBookmarked = false; // TODO: Implement bookmark functionality
  const isAuthor = user?.id === post.userId;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setDeleteDialogOpen(true);
    },
    []
  );

  return (
    <>
      <ProfileCardDialog
        open={profileDialogOpen}
        setOpen={setProfileDialogOpen}
        userId={userId}
      />
      <PostDeleteDialog
        postId={post.id}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
      <div className="w-full max-w-2xl bg-background rounded-2xl p-8 shadow-md shadow-background/30 group space-y-6">
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
            >
              <StarIcon />
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
                <DropdownMenuItem onClick={() => setProfileDialogOpen(true)}>
                  View Author
                </DropdownMenuItem>
                <DropdownMenuItem>Like Post</DropdownMenuItem>
                <DropdownMenuItem>Save Post</DropdownMenuItem>
                <DropdownMenuItem>Copy Link</DropdownMenuItem>
                <DropdownMenuItem>Preview Chat</DropdownMenuItem>
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
            >
              <HeartIcon className={isLiked ? "fill-red-500" : ""} /> {12}
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="secondary"
              className={cn("cursor-pointer")}
            >
              <Eye />
            </Button>

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
      <Separator />
    </>
  );
};
