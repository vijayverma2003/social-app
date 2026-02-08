import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ImageCollage } from "@/features/posts/components/ImageCollage";
import { cn, graphemeLengthWithoutSpaces, isOnlyEmojisAndWhitespace } from "@/lib/utils";
import { useUser } from "@/providers/UserContextProvider";
import { createMessage, deleteMessage } from "@/services/messagesService";
import { OptimistcMessageData } from "@/stores/messagesStore";
import { useProfilesStore } from "@/stores/profilesStore";
import { Loader2, RotateCcw } from "lucide-react";
import { usePathname } from "next/navigation";
import { memo, useMemo } from "react";

interface MessagePreviewProps {
  message: OptimistcMessageData & { lastMessage?: OptimistcMessageData | null; repliedToMessage?: OptimistcMessageData | null };
  onEdit?: (
    messageId: string,
    messageContent: string,
    attachments?: OptimistcMessageData["attachments"]
  ) => void;
  onReply?: (message: OptimistcMessageData) => void;
  highlight?: boolean;
}

const MessagePreview = memo(({
  message,
  onEdit,
  onReply,
  highlight
}: MessagePreviewProps) => {
  const pathname = usePathname();
  const { user } = useUser();
  const profile = useProfilesStore((state) =>
    state.getProfile(message.authorId)
  );

  const messageLink = message.channelType === "post" ? `/channels/${pathname.split('/')[2]}/${message.channelId}/${message.id}` : `/channels/@me/${message.channelId}/${message.id}`;

  const isOptimistic = message.id.startsWith("optimistic-");
  const hasError = !!message.error;
  const uploadingFiles = message.uploadingFiles || [];

  const repliedToProfile = useProfilesStore((state) =>
    message.repliedToMessage ? state.getProfile(message.repliedToMessage.authorId) : null
  );

  const handleRetry = () => {
    if (hasError && user) {
      const { channelId, channelType, content, attachments, id } = message;
      const storageObjectIds = attachments?.map((a) => a.storageObjectId) || [];

      createMessage(
        {
          channelId,
          channelType,
          content,
          storageObjectIds,
          optimisticId: id,
        },
        { optimisticId: id }
      );
    }
  };

  const isSameDay =
    new Date(message.createdAt).toDateString() === new Date().toDateString();

  const showAvatar = useMemo(() => {
    if (!message.lastMessage) return true;

    const isSameAuthor = message.lastMessage.authorId === message.authorId;
    if (!isSameAuthor) return true;

    const timeDiff =
      new Date(message.createdAt).getTime() -
      new Date(message.lastMessage.createdAt).getTime();

    return timeDiff > 5 * 60 * 1000;
  }, [message.lastMessage, message.authorId, message.createdAt]);

  const hasEmotesOnly = useMemo(() => isOnlyEmojisAndWhitespace(message.content), [message.content]);
  const hasManyEmotes = useMemo(() => hasEmotesOnly ? graphemeLengthWithoutSpaces(message.content) > 10 : false, [message.content, hasEmotesOnly]);
  return (
    <ContextMenu>
      <ContextMenuTrigger className="select-text">
        <div
          className={cn(
            "p-0 flex items-start gap-3 hover:bg-accent/15 rounded-sm px-4",
            showAvatar && "pt-4",
            highlight && "bg-primary/10 border-l-2 border-primary"
          )}
        >
          {showAvatar ? (
            <Avatar className="size-10">
              <AvatarImage src={profile?.avatarURL || undefined} />
              <AvatarFallback>
                {profile?.displayName?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-10" /> // Spacer to maintain alignment
          )}

          <div className="flex flex-col">
            {showAvatar && (
              <div className="flex gap-2 items-center mb-1">
                <p className="text-sm font-extrabold">
                  {profile?.displayName || "Unknown User"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {isSameDay
                    ? new Date(message.createdAt).toLocaleString("en-US", {
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    })
                    : new Date(message.createdAt).toLocaleString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    })}
                </p>
              </div>
            )}
            {/* Show reply preview */}
            {message.replyToMessageId && (
              <div className="flex items-center gap-2 mb-2 h-6 px-2 bg-muted/50 rounded border-l-2 border-primary/50">
                {message.repliedToMessage ? (
                  <>
                    <p className="text-xs font-medium text-primary">
                      {repliedToProfile?.displayName || "Unknown User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {message.repliedToMessage.content}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Message could not be loaded
                  </p>
                )}
              </div>
            )}
            {/* Show uploading files */}
            {uploadingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {uploadingFiles.map(
                  (file: { id: string; name: string; size: number }) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm"
                    >
                      <Loader2 className="size-3 animate-spin" />
                      <span className="truncate max-w-[200px]">
                        {file.name}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
            {/* Show uploaded attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="max-w-xl">
                {/* Image collage */}
                <ImageCollage
                  images={message.attachments.map((attachment) => ({
                    id: attachment.storageObjectId,
                    url: attachment.url,
                    fileName: attachment.fileName,
                    contentType: attachment.contentType,
                    width: null,
                    height: null,
                    alt: attachment.fileName,
                  }))}
                  className="mb-2"
                />

                {/* Non-image attachments */}
                {message.attachments
                  .filter(
                    (att) => !(att.contentType?.startsWith("image/") ?? false)
                  )
                  .map((attachment) => (
                    <div
                      key={attachment.storageObjectId}
                      className="p-4 rounded-2xl flex items-center gap-2 mb-2"
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
              </div>
            )}
            <div className="flex items-center gap-2">
              <p
                className={cn(
                  "text-base whitespace-pre-wrap",
                  isOptimistic && !hasError && "text-muted-foreground",
                  hasError && "text-destructive",
                  hasEmotesOnly ? !hasManyEmotes ? "text-5xl" : "text-2xl" : ""
                )}
              >
                {message.content}
              </p>
              {hasError && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRetry}
                  className="h-6 px-2 text-destructive hover:text-destructive"
                >
                  <RotateCcw className="size-3 mr-1" />
                  Retry
                </Button>
              )}
            </div>
            {hasError && (
              <p className="text-xs text-destructive mt-1">
                {(message as any).error}
              </p>
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => navigator.clipboard.writeText(message.content)}
        >
          Copy Text
        </ContextMenuItem>
        {!isOptimistic && (
          <>
            <ContextMenuItem
              onClick={() => {
                if (onReply) {
                  onReply(message);
                }
              }}
            >
              Reply
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}${messageLink}`)
              }}
            >
              Copy Link
            </ContextMenuItem>
          </>
        )}
        {user && message.authorId === user.id && !isOptimistic && (
          <>
            <ContextMenuItem
              onClick={() => {
                if (onEdit) {
                  onEdit(
                    message.id,
                    message.content,
                    message.attachments || []
                  );
                }
              }}
            >
              Edit Message
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() =>
                deleteMessage({
                  messageId: message.id,
                  channelId: message.channelId,
                  channelType: message.channelType,
                })
              }
              variant="destructive"
            >
              Delete Message
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
});

MessagePreview.displayName = "MessagePreview";

export default MessagePreview;
