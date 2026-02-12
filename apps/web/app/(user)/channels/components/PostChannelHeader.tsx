import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePostsStore } from "@/features/posts/store/postsStore";
import { useProfilesStore } from "@/stores/profilesStore";
import { Dot, X } from "lucide-react";
import { useConversationPreview } from "@/contexts/conversationPreviewContext";
import { Button } from "@/components/ui/button";

const PostChannelHeader = ({
  postId,
  isConversationPreview,
}: {
  postId: string;
  isConversationPreview?: boolean;
}) => {
  const { closeConversation } = useConversationPreview();
  const post = usePostsStore((state) => state.getPost(postId));
  console.log(post);

  const authorProfile = post?.userId
    ? useProfilesStore((state) => state.getProfile(post.userId))
    : null;

  //   TODO: Fetch post if not found in the store.

  return (
    <header className="p-3 border-b flex items-center gap-2 justify-between">
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium">
          {post && post.content ? (
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarImage src={authorProfile?.avatarURL || undefined} />
                <AvatarFallback>
                  {authorProfile?.displayName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <p>{authorProfile?.displayName}</p>
              <Dot color="var(--muted-foreground)" />
              <p>
                {post.content.slice(0, 30) +
                  (post.content.length > 30 ? "..." : "")}
              </p>
            </div>
          ) : (
            <p>Post Channel</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isConversationPreview && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="cursor-pointer"
            onClick={closeConversation}
          >
            <X />
          </Button>
        )}
      </div>
    </header>
  );
};

export default PostChannelHeader;
