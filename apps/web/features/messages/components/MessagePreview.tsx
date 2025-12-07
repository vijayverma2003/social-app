import { MessageData } from "@shared/schemas/messages";
import { Profile } from "@shared/types/responses";
import Image from "next/image";
import { useMemo } from "react";

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
    <div className="p-2 rounded-lg flex items-start gap-2 hover:bg-accent/40">
      <Image
        src={profile?.avatarURL || ""}
        alt={profile?.displayName || "Unknown user"}
        width={32}
        height={32}
        className="rounded-full"
      />
      <div className="flex flex-col">
        <div className="flex gap-2 items-center">
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
        <p className="text-sm">{message.content}</p>
      </div>
    </div>
  );
};

export default MessagePreview;
