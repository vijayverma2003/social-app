"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser } from "@/providers/UserContextProvider";
import { useProfilesStore } from "@/stores/profilesStore";
import { Dot, EllipsisVerticalIcon, MessageCircleIcon } from "lucide-react";

interface ProfileCardProps {
  userId?: string;
  variant: "popover" | "card";
}

const ProfileCard = ({ userId, variant = "card" }: ProfileCardProps) => {
  const { user } = useUser();

  const profile = useProfilesStore((state) =>
    state.getProfile(userId || user?.id || "")
  );

  const isPremium = true;
  const bannerURL = isPremium ? profile?.bannerURL || "" : "";
  const avatarURL = profile?.avatarURL || "";
  const displayName = profile?.displayName || "";
  const pronouns = profile?.pronouns || "";
  const bio = profile?.bio || "";
  const profileGradientStart = isPremium
    ? profile?.profileGradientStart || "#000000"
    : "#1c1e21";
  const profileGradientEnd = isPremium
    ? profile?.profileGradientEnd || "#000000"
    : "#1c1e21";

  // Get username and discriminator - prefer profile, fallback to user
  const username = profile?.username || user?.username || "";
  const discriminator = profile?.discriminator || user?.discriminator || "";

  const mixColor: string = "#000000";

  const outerProfileGradient = `linear-gradient(to bottom,
            color-mix(in oklab, hsl(from ${profileGradientStart} h s l) 50%, ${mixColor}),
            color-mix(in oklab, hsl(from ${profileGradientEnd} h s l) 50%, ${mixColor}))`;

  const innerProfileGradient = `linear-gradient(to bottom,
            color-mix(in oklab, hsl(from ${profileGradientStart} h s l) 40%, ${mixColor}),
            color-mix(in oklab, hsl(from ${profileGradientStart} h s l) 30%, ${mixColor}),
            color-mix(in oklab, hsl(from ${profileGradientEnd} h s l) 50%, ${mixColor}))`;

  const fadeBackground = `color-mix(in oklab, transparent 60%, color-mix(in oklab, hsl(from ${profileGradientStart} h s l) 50%, hsl(from ${profileGradientEnd} h s l) 50%))`;

  return (
    <>
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
            className="absolute inset-0 bg-no-repeat bg-cover h-56 mask-b-from-20% mask-b-to-70% opacity-60 pointer-events-none"
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
                mixColor === "#ffffff" ? "border-white/50" : "border-black/50"
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

              {profile?.username && (
                <div className="text-xs text-black/50 font-semibold flex items-center">
                  <p
                    className={cn(
                      mixColor === "#ffffff" ? "text-black/50" : "text-white/50"
                    )}
                  >
                    {username}#{discriminator}
                  </p>
                  {profile?.pronouns && (
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
            <div className="flex items-center gap-2">
              <Button
                size={variant === "popover" ? "sm" : "default"}
                onClick={() => {
                  console.log("add friend");
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
                Add Friend
              </Button>
              <Button
                size={variant === "popover" ? "icon-sm" : "icon"}
                onClick={() => {
                  console.log("send message");
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
            </div>
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
    </>
  );
};

export default ProfileCard;
