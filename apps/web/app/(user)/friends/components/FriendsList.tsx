"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFriendActions } from "@/hooks/useFriendActions";
import { useFriendsStore } from "@/store/friendsStore";
import { type FriendsList } from "@shared/types/responses";
import { MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface FriendsListProps {
  friends: FriendsList[];
}

const FriendsList = ({ friends }: FriendsListProps) => {
  const router = useRouter();
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null);
  const { removeFriend } = useFriendActions();
  const { removeFriendById } = useFriendsStore();

  const handleViewProfile = (friend: FriendsList) => {
    // TODO: Update this route based on your profile routing structure
    // Using username+discriminator as identifier for now
    const userTag = `${friend.username}#${friend.discriminator}`;
    router.push(`/profile/${encodeURIComponent(userTag)}`);
  };

  const handleSendMessage = (friend: FriendsList) => {
    // TODO: Update this route based on your DM routing structure
    if (friend.dmChannelId) {
      router.push(`/connections/dm/${friend.dmChannelId}`);
    } else {
      // If no DM channel exists, you might want to create one first
      console.warn("No DM channel ID available for this friend");
    }
  };

  const handleRemoveFriend = (friend: FriendsList) => {
    if (removingFriendId === friend.id) return;

    setRemovingFriendId(friend.id);
    removeFriend(friend.id, (response) => {
      // Check if the server returned an error
      if (response.error || !response.success) {
        const errorMessage = response.error || "Failed to remove friend";
        toast.error(errorMessage);
        setRemovingFriendId(null);
        return;
      }

      // Only remove from store if the operation was successful
      removeFriendById(friend.id);
      setRemovingFriendId(null);
    });
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
                  disabled={!friend.dmChannelId}
                >
                  <span>Send Message</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleRemoveFriend(friend)}
                  className="cursor-pointer text-destructive focus:text-destructive"
                  variant="destructive"
                  disabled={removingFriendId === friend.id}
                >
                  <span>
                    {removingFriendId === friend.id
                      ? "Removing..."
                      : "Remove Friend"}
                  </span>
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
