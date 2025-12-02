import Image from "next/image";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Profile, User } from "@database/postgres/generated/prisma/client";

const FloatingProfile = ({ user }: { user: User & { profile: Profile } }) => {
  return (
    <div className="max-w-md rounded-xl overflow-hidden bg-accent">
      <div className="relative w-full h-40">
        {user.profile.bannerURL ? (
          <Image
            src={user.profile.bannerURL || ""}
            alt={user.profile.displayName || ""}
            fill
          />
        ) : (
          <div
            style={{ backgroundColor: "#4e83d9" }}
            className="w-full h-full"
          ></div>
        )}
      </div>

      <span className="absolute -translate-y-1/2 translate-x-1/5 inline-block rounded-full border-2 border-muted-foreground">
        <Avatar className="size-32">
          <AvatarImage
            src={user.profile.avatarURL || ""}
            alt={user.profile.displayName || ""}
          />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </span>
      <div className="p-4 mt-14 mx-4">
        <h1 className="text-2xl font-bold">{user.profile.displayName}</h1>
        <p className="text-sm text-muted-foreground">
          {user.username + user.discriminator}
        </p>
      </div>
      <div className="p-4 mx-4 mb-4 min-h-24">
        {user.profile.bio && (
          <p className="text-sm text-muted-foreground">{user.profile.bio}</p>
        )}
      </div>
    </div>
  );
};

export default FloatingProfile;
