import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ImageCollage } from "@/features/posts/components/ImageCollage";
import { cn } from "@/lib/utils";
import { useUser } from "@/providers/UserContextProvider";
import { createMessage, deleteMessage } from "@/services/messagesService";
import { useProfilesStore } from "@/stores/profilesStore";
import { OptimistcMessageData } from "@/features/messages/store/messagesStore";
import { Loader2, RotateCcw, Pencil } from "lucide-react";
import { memo, useMemo } from "react";

interface MessagePreviewProps {
  message: OptimistcMessageData;
  lastMessage?: OptimistcMessageData | null;
  onEdit?: (
    messageId: string,
    messageContent: string,
    attachments?: OptimistcMessageData["attachments"]
  ) => void;
  onReply?: (message: OptimistcMessageData) => void;
  repliedToMessage?: OptimistcMessageData | null;
  highlightedMessageId?: string;
}

const MessagePreview = memo(({
  message,
  lastMessage,
  onEdit,
  onReply,
  repliedToMessage,
  highlightedMessageId
}: MessagePreviewProps) => {
  const { user } = useUser();
  const profile = useProfilesStore((state) =>
    state.getProfile(message.authorId)
  );

  const isOptimistic = message.id.startsWith("optimistic-");
  const hasError = !!message.error;
  const uploadingFiles = message.uploadingFiles || [];

  const repliedToProfile = useProfilesStore((state) =>
    repliedToMessage ? state.getProfile(repliedToMessage.authorId) : null
  );

  const isHighlighted = highlightedMessageId === message.id;

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
    if (!lastMessage) return true;

    const isSameAuthor = lastMessage.authorId === message.authorId;
    if (!isSameAuthor) return true;

    const timeDiff =
      new Date(message.createdAt).getTime() -
      new Date(lastMessage.createdAt).getTime();

    return timeDiff > 5 * 60 * 1000;
  }, [lastMessage, message.authorId, message.createdAt]);

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={cn(
            "p-0 flex items-start gap-3 hover:bg-accent/15 rounded-sm px-4",
            showAvatar && "mt-4",
            isHighlighted && "bg-primary/10 border-l-2 border-primary"
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
                {repliedToMessage ? (
                  <>
                    <p className="text-xs font-medium text-primary">
                      {repliedToProfile?.displayName || "Unknown User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {repliedToMessage.content}
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
                  "text-sm whitespace-pre-wrap",
                  isOptimistic && !hasError && "text-muted-foreground",
                  hasError && "text-destructive"
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
          <ContextMenuItem
            onClick={() => {
              if (onReply) {
                onReply(message);
              }
            }}
          >
            Reply
          </ContextMenuItem>
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
