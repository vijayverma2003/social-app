"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostData } from "@shared/schemas/post";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: PostData;
  authorUsername?: string;
  authorDiscriminator?: string;
  authorAvatarUrl?: string | null;
}

export const PostCard = ({
  post,
  authorUsername,
  authorDiscriminator,
  authorAvatarUrl,
}: PostCardProps) => {
  const timeAgo = useMemo(() => {
    return formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  }, [post.createdAt]);

  const displayName = authorUsername
    ? `${authorUsername}${authorDiscriminator ? `#${authorDiscriminator}` : ""}`
    : "Unknown user";

  const initials = authorUsername
    ? authorUsername.charAt(0).toUpperCase()
    : "U";

  const channelHref = post.channelId
    ? `/channels/${post.id}/${post.channelId}`
    : undefined;

  const cardContent = (
    <div className="p-4 rounded-3xl bg-secondary/50 hover:bg-secondary/70 transition-colors">
      <div className="flex items-start gap-3">
        <Avatar className="size-10">
          <AvatarImage src={authorAvatarUrl || ""} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-semibold">{displayName}</p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>

          {post.content && (
            <p className="text-sm mb-3 whitespace-pre-wrap wrap-break-word">
              {post.content}
            </p>
          )}

          {post.attachments && post.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {post.attachments.map((attachment) => {
                const isImage =
                  attachment.contentType?.startsWith("image/") ?? false;

                return (
                  <div
                    key={attachment.id}
                    className="rounded-lg overflow-hidden border"
                  >
                    {isImage ? (
                      <Image
                        src={attachment.url}
                        alt={attachment.fileName}
                        width={400}
                        height={400}
                        className="max-w-full h-auto"
                      />
                    ) : (
                      <div className="p-4 bg-muted flex items-center gap-2">
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
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (channelHref) {
    return (
      <Link href={channelHref} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};
