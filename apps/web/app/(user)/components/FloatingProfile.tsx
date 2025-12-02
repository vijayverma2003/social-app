import Image from "next/image";
import { UpdateUserProfileSchema } from "@shared/schemas/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const FloatingProfile = ({ user }: { user: UpdateUserProfileSchema }) => {
  return (
    <div className="max-w-md rounded-xl overflow-hidden bg-accent">
      <div className="relative w-full h-40">
        {user.bannerURL ? (
          <Image src={user.bannerURL || ""} alt={user.displayName || ""} fill />
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
            src={user.avatarURL || ""}
            alt={user.displayName || ""}
          />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </span>
      <div className="p-4 mt-14 mx-4">
        <h1 className="text-2xl font-bold">{user.displayName}</h1>
        <p className="text-sm text-muted-foreground">{user.displayName}</p>
      </div>
      <div className="p-4 mx-4 mb-4 min-h-24">
        {user.bio && (
          <p className="text-sm text-muted-foreground">{user.bio}</p>
        )}
      </div>
    </div>
  );
};

export default FloatingProfile;
