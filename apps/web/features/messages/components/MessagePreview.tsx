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

const MessagePreview = ({
  message,
  profile,
}: {
  message: MessageData;
  profile: Profile | null;
}) => {
  const isSameDay = useMemo(() => {
    return (
      new Date(message.createdAt).toDateString() === new Date().toDateString()
    );
  }, [message.createdAt]);

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="p-2 rounded-lg flex items-start gap-2 hover:bg-accent/40">
          <Avatar className="size-12">
            <AvatarImage src={profile?.avatarURL || ""} />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>

          <div className="flex flex-col">
            <div className="flex gap-2 items-center">
              <p className="text-sm font-extrabold mb-2">
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
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default MessagePreview;
