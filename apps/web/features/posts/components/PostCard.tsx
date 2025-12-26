"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PostData } from "@shared/schemas/post";
import { formatDistanceToNow } from "date-fns";
import { useMemo } from "react";
import { ImageCollage } from "./ImageCollage";

interface PostCardProps {
  post: PostData;
  authorUsername?: string;
  authorDiscriminator?: string;
  authorAvatarUrl?: string | null;
  onPreviewChat?: (post: PostData) => void;
}

export const PostCard = ({
  post,
  authorUsername,
  authorDiscriminator,
  authorAvatarUrl,
  onPreviewChat,
}: PostCardProps) => {
  const timeAgo = useMemo(() => {
    return formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  }, [post.createdAt]);

  const displayName = authorUsername
    ? `${authorUsername}${authorDiscriminator ? `#${authorDiscriminator}` : ""}`
    : "Unknown user";

  const initials = useMemo(() => {
    return authorUsername ? authorUsername.charAt(0).toUpperCase() : "U";
  }, [authorUsername]);

  // Memoize avatar URL to prevent flickering
  const avatarUrl = useMemo(() => {
    return authorAvatarUrl || undefined;
  }, [authorAvatarUrl]);

  const channelHref = post.channelId
    ? `/channels/${post.id}/${post.channelId}`
    : undefined;

  return (
    <div className="p-4 rounded-3xl bg-secondary/50">
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          <Avatar className="size-10">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-semibold">{displayName}</p>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>
        </div>

        {post.content && (
          <p className="text-sm mb-3 whitespace-pre-wrap wrap-break-word">
            {post.content}
          </p>
        )}

        {post.attachments && post.attachments.length > 0 && (
          <>
            {/* Image collage */}
            <ImageCollage images={post.attachments} />

            {/* Non-image attachments */}
            {post.attachments
              .filter(
                (att) => !(att.contentType?.startsWith("image/") ?? false)
              )
              .map((attachment) => (
                <div
                  key={attachment.id}
                  className="p-4 bg-muted rounded-2xl flex items-center gap-2 mb-2"
                >
                  <span className="text-sm">{attachment.fileName}</span>
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View
                  </a>
                </div>
              ))}
          </>
        )}

        {/* Chat preview button - shown for all posts with channelId */}
        {post.channelId && (
          <div className="flex justify-end w-full">
            <Button
              variant="secondary"
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onPreviewChat?.(post);
              }}
            >
              Preview Chat
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
