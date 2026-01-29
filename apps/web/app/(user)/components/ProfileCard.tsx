"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProfileCardViewer } from "@/contexts/profileCardViewer";
import { useSettings } from "@/contexts/settingsContext";
import { useFriendActions } from "@/features/friends/hooks/useFriendActions";
import { useFriendRequestsStore } from "@/features/friends/store/friendRequestsStore";
import { useFriendsStore } from "@/features/friends/store/friendsStore";
import { getDMChannel } from "@/services/channelService";
import { cn, isLightColor } from "@/lib/utils";
import { useUser } from "@/providers/UserContextProvider";
import { useProfilesStore } from "@/stores/profilesStore";
import {
  Dot,
  EllipsisVerticalIcon,
  MessageCircleIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";

// Friend Buttons Component
interface FriendButtonsProps {
  variant: "popover" | "card";
  fadeBackground?: string;
  mixColor?: string;
  friendEntry: { id: string; channelId: string | null } | null;
  userId?: string;
}

export const FriendButtons = ({
  variant,
  fadeBackground,
  mixColor,
  friendEntry,
  userId,
}: FriendButtonsProps) => {
  const router = useRouter();
  const { openProfileCard } = useProfileCardViewer();
  const { removeFriend } = useFriendActions();

  const handleSendMessage = () => {
    if (friendEntry?.channelId) {
      router.push(`/channels/@me/${friendEntry.channelId}`);
    }
  };

  const handleRemoveFriend = () => {
    if (friendEntry) {
      removeFriend(friendEntry.id);
    }
  };

  const handleViewProfile = () => {
    if (variant === "popover" && userId) {
      openProfileCard(userId);
    }
  };

  return (
    <>
      <Button
        size={variant === "popover" ? "sm" : "default"}
        onClick={handleSendMessage}
        variant="secondary"
        style={{ background: fadeBackground }}
        className={cn(
          "cursor-pointer",
          mixColor === "#ffffff"
            ? "text-black border-black/10"
            : "text-white border-white/10"
        )}
        disabled={!friendEntry?.channelId}
      >
        Send Message
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ size: "icon", variant: "secondary" }),
            "cursor-pointer",
            mixColor === "#ffffff"
              ? "text-black border-black/10"
              : "text-white border-white/10"
          )}
          style={{ background: fadeBackground }}
        >
          <EllipsisVerticalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {variant === "popover" && (
            <DropdownMenuItem
              onClick={handleViewProfile}
              className="cursor-pointer"
            >
              View Profile
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={handleSendMessage}
            className="cursor-pointer"
            disabled={!friendEntry?.channelId}
          >
            Send Message
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleRemoveFriend}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            Remove Friend
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

// Non-Friend Buttons Component
interface NonFriendButtonsProps {
  variant: "popover" | "card";
  fadeBackground: string;
  mixColor: string;
  userId?: string;
  username: string;
  discriminator: string;
}

const NonFriendButtons = ({
  variant,
  fadeBackground,
  mixColor,
  userId,
  username,
  discriminator,
}: NonFriendButtonsProps) => {
  const router = useRouter();
  const { sendFriendRequest, sendFriendRequestByUserId } = useFriendActions();
  const sentRequests = useFriendRequestsStore((state) => state.sent);

  // Check if there's a pending friend request for this user
  const pendingRequest = useMemo(() => {
    if (!userId) return undefined;
    return sentRequests.find((request) => request.userId === userId);
  }, [sentRequests, userId]);

  const isPending = !!pendingRequest;

  const handleAddFriend = () => {
    if (userId) {
      sendFriendRequestByUserId(userId, () => {
        // Success callback - the store will be updated automatically
      });
      return;
    }

    const receiverTag = `${username}#${discriminator}`;
    sendFriendRequest(receiverTag, () => {
      // Success callback - the store will be updated automatically
    });
  };

  const handleSendMessage = async () => {
    if (!userId) return;

    try {
      const channel = await getDMChannel(userId);
      router.push(`/channels/@me/${channel.id}`);
    } catch (error) {
      toast.error("Failed to open DM channel");
      console.error("Failed to open DM channel:", error);
    }
  };

  return (
    <>
      <Button
        size={variant === "popover" ? "sm" : "default"}
        onClick={handleAddFriend}
        variant="secondary"
        style={{ background: fadeBackground }}
        className={cn(
          "cursor-pointer",
          mixColor === "#ffffff"
            ? "text-black border-black/10"
            : "text-white border-white/10"
        )}
        disabled={isPending}
      >
        {isPending ? "Pending Request" : "Add Friend"}
      </Button>
      <Button
        size={variant === "popover" ? "icon-sm" : "icon"}
        onClick={handleSendMessage}
        variant="secondary"
        style={{ background: fadeBackground }}
        className={cn(
          "cursor-pointer",
          mixColor === "#ffffff"
            ? "text-black border-black/10"
            : "text-white border-white/10"
        )}
      >
        <MessageCircleIcon />
      </Button>
      <Button
        size={variant === "popover" ? "icon-sm" : "icon"}
        onClick={() => {
          console.log("other options");
        }}
        variant="secondary"
        style={{ background: fadeBackground }}
        className={cn(
          "cursor-pointer",
          mixColor === "#ffffff"
            ? "text-black border-black/10"
            : "text-white border-white/10"
        )}
      >
        <EllipsisVerticalIcon />
      </Button>
    </>
  );
};

// Current User Buttons Component
interface CurrentUserButtonsProps {
  variant: "popover" | "card";
  fadeBackground: string;
  mixColor: string;
}

const CurrentUserButtons = ({
  variant,
  fadeBackground,
  mixColor,
}: CurrentUserButtonsProps) => {
  const { openSettings } = useSettings();

  const handleEditProfile = () => {
    openSettings("profile");
  };

  return (
    <>
      <Button
        size={variant === "popover" ? "sm" : "default"}
        onClick={handleEditProfile}
        variant="secondary"
        style={{ background: fadeBackground }}
        className={cn(
          "cursor-pointer",
          mixColor === "#ffffff"
            ? "text-black border-black/10"
            : "text-white border-white/10"
        )}
      >
        Edit Profile
      </Button>
    </>
  );
};

interface ProfileCardContentProps {
  variant: "popover" | "card";
  // Profile properties
  displayName: string;
  username: string;
  discriminator: string;
  pronouns: string;
  avatarURL: string;
  bannerURL: string;
  bio: string;
  profileGradientStart: string | null;
  profileGradientEnd: string | null;
  // Button props
  isFriend?: boolean;
  isCurrentUser?: boolean;
  friendEntry?: { id: string; channelId: string | null } | null;
  userId?: string;
}

export const ProfileCardContent = ({
  variant,
  displayName,
  username,
  discriminator,
  pronouns,
  avatarURL,
  bannerURL,
  bio,
  profileGradientStart,
  profileGradientEnd,
  isFriend = false,
  isCurrentUser = false,
  friendEntry = null,
  userId,
}: ProfileCardContentProps) => {
  // Compute custom properties within ProfileCardContent
  const isPremium = true; // This could be determined from profile or user subscription
  const mixColor: string = isLightColor(profileGradientStart || "") ? "#ffffff" : "#000000";


  const gradientStart = isPremium
    ? profileGradientStart || "#000000"
    : "#1c1e21";
  const gradientEnd = isPremium
    ? profileGradientEnd || "#000000"
    : "#1c1e21";

  const outerProfileGradient = `linear-gradient(to bottom,
            color-mix(in oklab, hsl(from ${gradientStart} h s l) 50%, ${mixColor}),
            color-mix(in oklab, hsl(from ${gradientEnd} h s l) 50%, ${mixColor}))`;

  const innerProfileGradient = `linear-gradient(to bottom,
            color-mix(in oklab, hsl(from ${gradientStart} h s l) 40%, ${mixColor}),
            color-mix(in oklab, hsl(from ${gradientStart} h s l) 30%, ${mixColor}),
            color-mix(in oklab, hsl(from ${gradientEnd} h s l) 50%, ${mixColor}))`;

  const fadeBackground = `color-mix(in oklab, transparent 60%, color-mix(in oklab, hsl(from ${gradientStart} h s l) 50%, hsl(from ${gradientEnd} h s l) 50%))`;

  // Create buttons based on relationship state
  const buttons = (
    <>
      {isFriend && !isCurrentUser ? (
        <FriendButtons
          variant={variant}
          fadeBackground={fadeBackground}
          mixColor={mixColor}
          friendEntry={friendEntry}
          userId={userId}
        />
      ) : !isCurrentUser ? (
        <NonFriendButtons
          variant={variant}
          fadeBackground={fadeBackground}
          mixColor={mixColor}
          userId={userId}
          username={username}
          discriminator={discriminator}
        />
      ) : (
        <CurrentUserButtons
          variant={variant}
          fadeBackground={fadeBackground}
          mixColor={mixColor}
        />
      )}
    </>
  );

  return (
    <div
      style={isPremium ? { background: outerProfileGradient } : {}}
      className={cn(
        "min-w-[300px] max-w-[450px] w-full rounded-3xl overflow-hidden p-1.5 bg-secondary",
        mixColor === "#ffffff" ? "text-black" : "text-white"
      )}
    >
      <div
        className="h-full w-full p-2 relative rounded-2xl overflow-hidden bg-no-repeat bg-cover bg-background/50"
        style={isPremium ? { background: innerProfileGradient } : {}}
      >
        <div
          className="absolute inset-0 bg-no-repeat bg-cover h-56 mask-b-from-20% mask-b-to-70% opacity-90 pointer-events-none"
          style={{ backgroundImage: `url(${bannerURL})` }}
        />

        <div
          className={cn(
            `flex items-center justify-start`,
            variant === "popover" ? "p-2 gap-3" : "p-6 gap-6"
          )}
        >
          <Avatar
            className={cn(
              variant === "popover" ? "size-24" : "size-32",
              `border-3 border-transparent`,
              mixColor === "#ffffff" ? "border-white/50" : "border-black/50",
            )}
          >
            <AvatarImage src={avatarURL} alt={displayName} />
            <AvatarFallback></AvatarFallback>
          </Avatar>

          <div className="flex flex-col items-start z-10">
            <h1
              className={cn(
                "text-2xl font-bold",
                variant === "popover" ? "text-lg" : "text-2xl"
              )}
            >
              {displayName}
            </h1>

            {username && (
              <div className="text-xs text-black/50 font-semibold flex items-center">
                <p
                  className={cn(
                    mixColor === "#ffffff" ? "text-black/50" : "text-white/50"
                  )}
                >
                  {username}#{discriminator}
                </p>
                {pronouns && (
                  <Dot
                    size="16"
                    className={cn(
                      mixColor === "#ffffff"
                        ? "text-black/50"
                        : "text-white/50"
                    )}
                  />
                )}
                <p
                  className={cn(
                    mixColor === "#ffffff" ? "text-black/50" : "text-white/50"
                  )}
                >
                  {pronouns}
                </p>
              </div>
            )}
          </div>
        </div>

        <div
          className={cn(
            `z-50`,
            variant === "popover" ? "px-4 pb-3" : "px-8 pb-6"
          )}
        >
          <div className="flex items-center gap-2">{buttons}</div>
          {variant === "card" && (
            <div className="mt-4 text-black/80">
              <p
                className={cn(
                  "text-sm whitespace-pre-wrap leading-tight",
                  mixColor === "#ffffff" ? "text-black/80" : "text-white/80"
                )}
              >
                {bio}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ProfileCardProps {
  userId?: string;
  variant: "popover" | "card";
}

const ProfileCard = ({ userId, variant = "card" }: ProfileCardProps) => {
  const { user } = useUser();
  const friends = useFriendsStore((state) => state.friends);

  const profile = useProfilesStore((state) =>
    state.getProfile(userId || user?.id || "")
  );

  // Check if the viewed user is a friend (must be before any early returns)
  const friendEntry = useMemo(() => {
    if (!userId) return null;
    const found = friends.find((friend) => friend.userId === userId);
    return found ? { id: found.id, channelId: found.channelId } : null;
  }, [friends, userId]);

  if (!profile) return null;

  // Get username and discriminator - prefer profile, fallback to user
  const username = profile?.username || user?.username || "";
  const discriminator = profile?.discriminator || user?.discriminator || "";

  const isFriend = !!friendEntry;
  const viewedUserId = userId || user?.id || "";
  const isCurrentUser = viewedUserId === user?.id;

  // Extract profile properties
  const bannerURL = profile?.bannerURL || "";
  const avatarURL = profile?.avatarURL || "";
  const displayName = profile?.displayName || "";
  const pronouns = profile?.pronouns || "";
  const bio = profile?.bio || "";
  const profileGradientStart = profile?.profileGradientStart || null;
  const profileGradientEnd = profile?.profileGradientEnd || null;

  return (
    <ProfileCardContent
      variant={variant}
      displayName={displayName}
      username={username}
      discriminator={discriminator}
      pronouns={pronouns}
      avatarURL={avatarURL}
      bannerURL={bannerURL}
      bio={bio}
      profileGradientStart={profileGradientStart}
      profileGradientEnd={profileGradientEnd}
      isFriend={isFriend}
      isCurrentUser={isCurrentUser}
      friendEntry={friendEntry}
      userId={userId}
    />
  );
};

export default ProfileCard;
