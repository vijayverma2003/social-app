"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  const handleViewProfile = (friend: FriendsList) => {
    // TODO: Update this route based on your profile routing structure
    // Using username+discriminator as identifier for now
    const userTag = `${friend.username}#${friend.discriminator}`;
    router.push(`/profile/${encodeURIComponent(userTag)}`);
  };

  const handleSendMessage = (friend: FriendsList) => {
    // TODO: Update this route based on your DM routing structure
    if (friend.channelId) {
      router.push(`/dms/${friend.channelId}`);
    } else {
      // If no DM channel exists, you might want to create one first
      console.warn("No DM channel ID available for this friend");
    }
  };

  return (
    <div>
      {friends.map((friend) => {
        return (
          <div
            key={friend.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-accent/50 p-4"
          >
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={friend.profile?.avatarURL || ""} />
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
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
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
