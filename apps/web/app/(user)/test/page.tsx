"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useUser } from "@/providers/UserContextProvider";
import {
  Dot,
  EllipsisVerticalIcon,
  Eye,
  HeartIcon,
  MessageCircle,
  StarIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const page = () => {
  const { user } = useUser();
  const postId = "123";
  const channelId = "456";
  const isLiked = false;
  const isBookmarked = false;
  const postBody =
    "Lorem ipsum dolor sit amet consectetur adipisicing elit. Labore, delectus culpa porro perferendis amet, neque vel minima corrupti ab illo, molestias veritatis ipsum quo deleniti natus voluptate ex. Dolor itaque fuga asperiores sed ea vero, necessitatibus repellat beatae sint officiis laudantium quo laborum perspiciatis architecto tempora quae eligendi iusto est?";

  const postAttachments = {
    portrait:
      "https://i.pinimg.com/736x/51/bd/40/51bd40c419311683d2c5d7969685c21f.jpg",
    square:
      "https://i.pinimg.com/736x/72/5b/a7/725ba7200d18cf99244ff606554fc9fc.jpg",
    landscape:
      "https://i.pinimg.com/736x/63/60/23/6360234bbb148dc875f4f682300467cb.jpg",
  };

  return (
    <section className="py-8 min-h-screen flex items-center justify-center bg-secondary/80">
      <div className="w-full max-w-xl bg-background rounded-2xl p-8 shadow-md shadow-background/30 border border-border space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar size="lg" className="border border-foreground/40">
              <AvatarImage src={user?.profile?.avatarURL || undefined} />
              <AvatarFallback>
                {user?.profile?.displayName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex gap-1 items-center">
              <p className="text-sm font-medium">
                {user?.profile?.displayName}
              </p>
              <Dot color="var(--muted-foreground)" />
              <p className="text-xs text-muted-foreground">12h</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "cursor-pointer hover:text-amber-500",
                isBookmarked && "text-amber-500 bg-amber-500/10"
              )}
            >
              <StarIcon />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ size: "icon", variant: "ghost" }),
                  "cursor-pointer"
                )}
              >
                <EllipsisVerticalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>View Author</DropdownMenuItem>
                <DropdownMenuItem>Like Post</DropdownMenuItem>
                <DropdownMenuItem>Save Post</DropdownMenuItem>
                <DropdownMenuItem>Copy Link</DropdownMenuItem>
                <DropdownMenuItem>Preview Chat</DropdownMenuItem>
                <DropdownMenuItem>Join Chat</DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  Delete
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-md whitespace-pre-wrap wrap-break-word leading-relaxed">
              {postBody}
            </p>
          </div>

          {/* Attachments */}
          <div className="grid grid-cols-2 gap-1 rounded-3xl overflow-hidden">
            <div className="rounded-lg overflow-hidden aspect-square">
              <Image
                src={postAttachments.square}
                alt="Attachment"
                width={200}
                height={200}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="rounded-lg aspect-square overflow-hidden">
              <Image
                src={postAttachments.portrait}
                alt="Attachment"
                width={200}
                height={200}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="rounded-lg overflow-hidden aspect-video col-span-2">
              <Image
                src={postAttachments.portrait}
                alt="Attachment"
                width={200}
                height={200}
                className="object-cover w-full h-full"
              />
            </div>
            {/* <div className="rounded-lg overflow-hidden aspect-square">
              <Image
                src={postAttachments.landscape}
                alt="Attachment"
                width={200}
                height={200}
                className="object-cover w-full h-full"
              />
            </div> */}
          </div>

          <div className="flex gap-1 items-center">
            <div className="*:data-[slot=avatar]:ring-background flex -space-x-3 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
              <Avatar size="sm">
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="@shadcn"
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar size="sm">
                <AvatarImage
                  src="https://github.com/maxleiter.png"
                  alt="@maxleiter"
                />
                <AvatarFallback>LR</AvatarFallback>
              </Avatar>
              <Avatar size="sm">
                <AvatarImage
                  src="https://github.com/evilrabbit.png"
                  alt="@evilrabbit"
                />
                <AvatarFallback>ER</AvatarFallback>
              </Avatar>
            </div>
            <p className="text-sm text-muted-foreground">
              Friends yapping here
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              className={cn(
                "cursor-pointer",
                isLiked ? "text-red-500 bg-red-500/10" : "hover:text-red-500"
              )}
            >
              <HeartIcon className={isLiked ? "fill-red-500" : ""} /> {12}
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="secondary"
              className={cn("cursor-pointer")}
            >
              <Eye />
            </Button>

            <Link
              href={`/channels/${postId}/${channelId}`}
              className={cn(
                "cursor-pointer",
                buttonVariants({ variant: "secondary" })
              )}
            >
              <MessageCircle />
              Join
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default page;
