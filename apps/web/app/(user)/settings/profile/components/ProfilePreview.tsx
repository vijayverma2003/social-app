"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { cn } from "@/lib/utils";
import { useUser } from "@/providers/UserContextProvider";
import { useProfilesStore } from "@/stores/profilesStore";
import { UserIcon } from "lucide-react";
import Image from "next/image";

const ProfilePreview = ({ userId }: { userId?: string }) => {
  const { user } = useUser();
  const profile = useProfilesStore((state) =>
    state.getProfile(userId || user?.id || "")
  );

  const bannerColor = profile?.bannerColor || "#4e83d9";
  const bannerURL = profile?.bannerURL || "";
  const avatarURL = profile?.avatarURL || "";
  const displayName = profile?.displayName || "";
  const pronouns = profile?.pronouns || "";
  const bio = profile?.bio || "";
  const profileGradientStart = profile?.profileGradientStart || "#000000";
  const profileGradientEnd = profile?.profileGradientEnd || "#000000";

  const outerProfileGradient = `linear-gradient(to bottom,
            color-mix(in oklab, hsl(from ${profileGradientStart} h s l) 50%, #000000),
            color-mix(in oklab, hsl(from ${profileGradientEnd} h s l) 50%, #000000))`;

  const innerProfileGradient = `linear-gradient(to bottom,
            color-mix(in oklab, hsl(from ${profileGradientStart} h s l) 80%, #000000),
            color-mix(in oklab, hsl(from ${profileGradientStart} h s l), #000000),
            color-mix(in oklab, hsl(from ${profileGradientEnd} h s l), #000000))`;

  return (
    <div
      style={{ background: outerProfileGradient }}
      className="h-full w-full z-40 profile-outer-radius overflow-hidden bg-secondary p-1 shadow-sm shadow-muted flex-1"
    >
      <div
        className="border-0 border-transparent h-full overflow-hidden profile-inner-radius flex flex-col gap-4 mb-4"
        style={{
          background: innerProfileGradient,
        }}
      >
        <div
          className={cn("h-36 w-full")}
          style={
            bannerColor
              ? { backgroundColor: bannerColor }
              : { backgroundColor: "var(--secondary)" }
          }
        >
          {bannerURL && (
            <Image
              src={bannerURL || ""}
              alt="Banner"
              width={100}
              height={100}
              className="object-cover h-full w-full"
            />
          )}
        </div>

        <div className="px-6">
          <div className="relative mb-4 flex justify-between">
            <Avatar
              style={{
                background: innerProfileGradient,
              }}
              className="size-30 absolute -top-3 -translate-y-1/2 left-0 p-1"
            >
              <AvatarImage
                src={avatarURL || ""}
                alt="Avatar"
                className={`object-cover rounded-full`}
              />
              <AvatarFallback>
                <UserIcon className="size-4" />
              </AvatarFallback>
            </Avatar>

            <div className="pt-12">
              <div>
                <h1 className="text-lg font-medium">{displayName}</h1>
                <p className="text-sm">{pronouns}</p>
              </div>
            </div>
            <div>
              <Button variant="outline">Add Friend</Button>
            </div>
          </div>
          <div>
            <div className="">
              <p className="text-sm">{bio}</p>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold mb-2">Joined on 29 June 2003</p>
            </div>
          </div>
        </div>

        {!userId && (
          <div className="px-4">
            <ButtonGroup orientation="vertical" className="w-full">
              <Button variant="outline" className="w-full cursor-pointer">
                View Profile
              </Button>
              <Button variant="outline" className="w-full cursor-pointer">
                Edit Profile
              </Button>
            </ButtonGroup>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePreview;
