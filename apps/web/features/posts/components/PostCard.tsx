"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostData } from "@shared/schemas/post";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

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
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          <Avatar className="size-10">
            <AvatarImage src={authorAvatarUrl || ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-semibold">{displayName}</p>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>
        </div>

        {post.attachments && post.attachments.length > 0 && (
          <div className="gap-2 mb-2 w-full">
            {post.attachments.map((attachment) => {
              const isImage =
                attachment.contentType?.startsWith("image/") ?? false;

              const aspectRatio =
                attachment.width && attachment.height
                  ? attachment.width / attachment.height
                  : 1;

              console.log(aspectRatio);

              return (
                <div
                  key={attachment.id}
                  className="rounded-2xl overflow-hidden"
                >
                  {isImage ? (
                    <div className="relative">
                      <Image
                        src={attachment.url}
                        alt={attachment.fileName}
                        width={500}
                        height={500}
                        className={"object-cover w-full"}
                      />
                    </div>
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

        {post.content && (
          <p className="text-sm mb-3 whitespace-pre-wrap wrap-break-word">
            {post.content}
          </p>
        )}
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
