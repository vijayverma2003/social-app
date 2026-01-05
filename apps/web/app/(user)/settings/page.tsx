import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { UserIcon } from "lucide-react";
import Image from "next/image";
import React from "react";

const page = async () => {
  const bannerColor = "#4e83d9";
  //   const bannerURL = "";
  const bannerURL =
    "https://i.pinimg.com/originals/8a/e1/04/8ae104a88d8fd8e5c4d1a9cbea4d4c96.gif";
  const avatarURL =
    "https://i.pinimg.com/originals/e6/5d/50/e65d50f699ab952ca89c8525058c4a0d.gif";
  const displayName = "John Doe";
  const pronouns = "he/him";
  const bio = "I am a software engineer";
  const profileGradientStart = "#e60000";
  const profileGradientEnd = "#000000";

  const outerProfileGradient = `linear-gradient(to bottom,
            color-mix(in oklab, hsl(from ${profileGradientStart} h s l) 50%, #000000),
            color-mix(in oklab, hsl(from ${profileGradientEnd} h s l) 50%, #000000))`;

  const innerProfileGradient = `linear-gradient(to bottom,
            color-mix(in oklab, hsl(from ${profileGradientStart} h s l) 80%, #000000),
            color-mix(in oklab, hsl(from ${profileGradientStart} h s l), #000000),
            color-mix(in oklab, hsl(from ${profileGradientEnd} h s l), #000000))`;

  return (
    <section className="flex items-center justify-center h-screen">
      <div
        style={{ background: outerProfileGradient }}
        className="max-w-[400px] max-h-[600px] h-full w-full z-40 profile-outer-radius overflow-hidden bg-secondary p-1 shadow-xl"
      >
        <div
          className="border-0 border-transparent h-full overflow-hidden profile-inner-radius"
          style={{
            background: innerProfileGradient,
          }}
        >
          <div
            className={cn("h-40 w-full")}
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
          <div className="px-6 mb-4">
            <div className="relative mb-4 flex justify-between">
              <Avatar
                style={{
                  background: innerProfileGradient,
                }}
                className="size-30 absolute -top-15 left-0 p-1"
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

              <div className="pt-16">
                <div>
                  <h1 className="text-lg font-medium">{displayName}</h1>
                  <p className="text-sm">{pronouns}</p>
                </div>
              </div>
              <div className="py-4">
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
        </div>
      </div>
    </section>
  );
};

export default page;
