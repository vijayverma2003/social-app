import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AddFriendButton } from "@/features/friends/components/AddFriendButton";
import { useFriendsStore } from "@/features/friends/store/friendsStore";
import { useUser } from "@/providers/UserContextProvider";
import { useDMChannelsStore } from "@/stores/dmChannelStore";
import { useProfilesStore } from "@/stores/profilesStore";
import { ViewProfileButton } from "../../components/ViewProfileButton";

interface DMChannelBeginningProps {
  channelId: string;
}

const DMChannelBeginning = ({ channelId }: DMChannelBeginningProps) => {
  const { user: currentUser } = useUser();
  const channel = useDMChannelsStore((state) => state.dmChannels[channelId]);

  const otherUser = channel.users.find(
    (user) => user.userId !== currentUser?.id,
  );

  if (!otherUser) return null;

  const profile = useProfilesStore((state) =>
    state.getProfile(otherUser?.userId),
  );

  const isFriend = useFriendsStore((state) => state.isFriend(otherUser.userId));

  return (
    <>
      <div className="p-4 flex flex-col gap-4 items-center">
        <Avatar className="size-16">
          <AvatarImage src={profile?.avatarURL || undefined} />
          <AvatarFallback>{profile?.displayName?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2 items-center">
          <h1 className="text-lg font-bold">{profile?.displayName}</h1>
          <div className="flex items-center gap-1">
            <ViewProfileButton
              userId={otherUser.userId}
              as="button"
              size="sm"
              text="View Profile"
              variant="secondary"
            />
            {isFriend && (
              <Button size="sm" variant="destructive">
                Remove Friend
              </Button>
            )}
            {!isFriend && otherUser.userId && (
              <AddFriendButton
                userId={otherUser.userId}
                size="sm"
                variant="secondary"
              />
            )}
          </div>
          <p className="text-xs mt-4">
            This is the beginning of your direct message conversation with{" "}
            {profile?.displayName}.
          </p>
        </div>
      </div>
      <div className="px-4">
        <Separator />
      </div>
    </>
  );
};

export default DMChannelBeginning;
