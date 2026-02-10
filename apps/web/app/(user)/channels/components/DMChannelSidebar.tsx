import { useUser } from "@/providers/UserContextProvider";
import { useDMChannelsStore } from "@/stores/dmChannelStore";
import ProfileCard from "../../components/ProfileCard";

const DMChannelSidebar = ({ channelId }: { channelId: string }) => {
  const { user: currentUser } = useUser();
  const dmChannel = useDMChannelsStore((state) => state.dmChannels[channelId]);

  const otherUser = dmChannel?.users.find(
    (user) => user.userId !== currentUser?.id,
  );

  return (
    <div className="p-4">
      <ProfileCard variant="popover" userId={otherUser?.userId || ""} />
    </div>
  );
};

export default DMChannelSidebar;
