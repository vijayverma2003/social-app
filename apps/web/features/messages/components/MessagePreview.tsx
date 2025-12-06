import { MessageData } from "@shared/schemas/messages";
import { DMChannelUserWithProfile } from "@shared/types/responses";
import Image from "next/image";

const MessagePreview = ({
  message,
  user,
}: {
  message: MessageData;
  user: DMChannelUserWithProfile | undefined;
}) => {
  return (
    <div className="p-2 rounded-lg flex items-start gap-2 group hover:bg-accent/40">
      <Image
        src={user?.user.profile?.avatarURL || ""}
        alt={user?.user.username || "Unknown user"}
        width={32}
        height={32}
        className="rounded-full"
      />
      <div className="flex flex-col">
        <div className="flex gap-2 items-center">
          <p className="text-sm font-extrabold">
            {user?.user.profile?.displayName ||
              user?.user.username ||
              "Unknown user"}
          </p>
          <p className="text-[10px] opacity-0 transition-opacity duration-300 text-muted-foreground group-hover:opacity-100">
            {new Date(message.createdAt).toLocaleString()}
          </p>
        </div>
        <p className="text-sm">{message.content}</p>
      </div>
    </div>
  );
};

export default MessagePreview;
