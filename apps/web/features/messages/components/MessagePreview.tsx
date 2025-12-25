import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageData } from "@shared/schemas/messages";
import { Profile } from "@shared/types/responses";
import Image from "next/image";
import { useMemo } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useMessageActions } from "../hooks/useMessageActions";
import { useUser } from "@/providers/UserContextProvider";
import { cn } from "@/lib/utils";

const MessagePreview = ({
  message,
  profile,
  lastMessage,
}: {
  message: MessageData;
  profile: Profile | null;
  lastMessage?: MessageData | null;
}) => {
  const { user } = useUser();
  const { deleteMessage } = useMessageActions();

  const isSameDay = useMemo(() => {
    return (
      new Date(message.createdAt).toDateString() === new Date().toDateString()
    );
  }, [message.createdAt]);

  // Calculate if avatar should be shown based on last message
  const showAvatar = useMemo(() => {
    if (!lastMessage) return true;

    const isSameAuthor = lastMessage.authorId === message.authorId;
    if (!isSameAuthor) return true;

    const timeDiff =
      new Date(message.createdAt).getTime() -
      new Date(lastMessage.createdAt).getTime();
    const isRecent = timeDiff < 5 * 60 * 1000; // 5 minutes in milliseconds

    return !isRecent;
  }, [lastMessage, message.authorId, message.createdAt]);

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={cn(
            "p-0 flex items-center gap-3 hover:bg-accent/40 rounded-sm px-2",
            showAvatar && "mt-4"
          )}
        >
          {showAvatar ? (
            <Avatar className="size-10">
              <AvatarImage src={profile?.avatarURL || undefined} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-10" /> // Spacer to maintain alignment
          )}

          <div className="flex flex-col">
            {showAvatar && (
              <div className="flex gap-2 items-center mb-1">
                <p className="text-sm font-extrabold">
                  {profile?.displayName || "Unknown user"}
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
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {message.attachments.map((attachment) => (
                  <div
                    key={attachment.url}
                    className="rounded-lg overflow-hidden"
                  >
                    <Image
                      src={attachment.url}
                      alt={attachment.fileName}
                      width={200}
                      height={200}
                    />
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm">{message.content}</p>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => navigator.clipboard.writeText(message.content)}
        >
          Copy Text
        </ContextMenuItem>
        {user && message.authorId === user.id && (
          <ContextMenuItem
            onClick={() =>
              deleteMessage({
                messageId: message._id,
                channelId: message.channelId,
                channelType: message.channelType,
              })
            }
            variant="destructive"
          >
            Delete Message
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default MessagePreview;
