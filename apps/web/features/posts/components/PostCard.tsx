"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PostResponse } from "@shared/types";
import { formatDistanceToNow } from "date-fns";
import { useMemo } from "react";
import { ImageCollage } from "./ImageCollage";
import { useProfilesStore } from "@/stores/profilesStore";

interface PostCardProps {
  post: PostResponse;
  userId: string;
  onPreviewChat?: (post: PostResponse) => void;
}

export const PostCard = ({ post, userId, onPreviewChat }: PostCardProps) => {
  const profile = useProfilesStore((state) => state.profiles[userId]);

  const timeAgo = useMemo(() => {
    return formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  }, [post.createdAt]);

  const displayName = profile.displayName || "Unknown";

  return (
    <div className="p-4 rounded-3xl bg-secondary/50">
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          <Avatar className="size-10">
            <AvatarImage src={profile.avatarURL || undefined} />
            <AvatarFallback>
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
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
            <ImageCollage
              images={post.attachments.map((att) => ({
                id: att.id,
                url: att.storageObject.url || "",
                fileName: att.storageObject.filename,
                contentType: att.storageObject.mimeType,
              }))}
            />

            {/* Non-image attachments */}
            {post.attachments
              .filter(
                (att) =>
                  !(att.storageObject.mimeType?.startsWith("image/") ?? false)
              )
              .map((attachment) => (
                <div
                  key={attachment.id}
                  className="p-4 bg-muted rounded-2xl flex items-center gap-2 mb-2"
                >
                  <span className="text-sm">
                    {attachment.storageObject.filename}
                  </span>
                  <a
                    href={attachment.storageObject.url || undefined}
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
