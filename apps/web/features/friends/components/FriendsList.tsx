"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProfileCardViewer } from "@/contexts/profileCardViewer";
import { useFriendActions } from "@/features/friends/hooks/useFriendActions";
import { type FriendsList } from "@shared/types/responses";
import { MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";

interface FriendsListProps {
  friends: FriendsList[];
}

const FriendsList = ({ friends }: FriendsListProps) => {
  const router = useRouter();
  const { removeFriend } = useFriendActions();
  const { openProfileCard } = useProfileCardViewer();

  const handleViewProfile = (friend: FriendsList) => {
    openProfileCard(friend.id);
  };

  const handleSendMessage = (friend: FriendsList) => {
    if (friend.channelId) router.push(`/channels/@me/${friend.channelId}`);
  };

  return (
    <div className="space-y-3">
      <h2 className="text-xs text-muted-foreground font-bold flex items-center gap-2">
        Your Friends
      </h2>
      {friends.map((friend) => {
        return (
          <div
            key={friend.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
          >
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={friend.profile?.avatarURL || undefined} />
                <AvatarFallback>
                  {friend.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{friend.username}</p>
                {friend.profile?.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {friend.profile.bio}
                  </p>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={buttonVariants({ variant: "ghost", size: "icon" })}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleViewProfile(friend)}
                  className="cursor-pointer"
                >
                  <span>View Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSendMessage(friend)}
                  className="cursor-pointer"
                  disabled={!friend.channelId}
                >
                  <span>Send Message</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => removeFriend(friend.id)}
                  className="cursor-pointer text-destructive focus:text-destructive"
                  variant="destructive"
                >
                  <span>Remove Friend</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}
    </div>
  );
};

export default FriendsList;
