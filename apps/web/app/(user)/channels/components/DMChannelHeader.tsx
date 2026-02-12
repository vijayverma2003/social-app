import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/providers/UserContextProvider";
import { useDMChannelsStore } from "@/stores/dmChannelStore";
import { useProfilesStore } from "@/stores/profilesStore";
import { useConversationPreview } from "@/contexts/conversationPreviewContext";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const DMChannelHeader = ({
  channelId,
  isConversationPreview,
}: {
  channelId: string;
  isConversationPreview?: boolean;
}) => {
  const { closeConversation } = useConversationPreview();
  const { user: currentUser } = useUser();
  const dmChannel = useDMChannelsStore((state) => state.dmChannels[channelId]);

  const otherUser = dmChannel?.users.find(
    (user) => user.userId !== currentUser?.id,
  );

  const otherUserProfile = useProfilesStore((state) =>
    state.getProfile(otherUser?.userId || ""),
  );

  return (
    <header className="p-3 border-b flex items-center gap-2 justify-between">
      <div className="flex items-center gap-2">
        <Avatar size="sm">
          <AvatarImage src={otherUserProfile?.avatarURL || undefined} />
          <AvatarFallback>
            {otherUserProfile?.displayName?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <p className="text-sm font-medium">{otherUserProfile?.displayName}</p>
      </div>
      <div className="flex items-center gap-2">
        {isConversationPreview && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="cursor-pointer"
            onClick={closeConversation}
          >
            <X />
          </Button>
        )}
      </div>
    </header>
  );
};

export default DMChannelHeader;
