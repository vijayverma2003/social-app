import { usePostsStore } from "@/features/posts/store/postsStore";

const PostDiscussionBeginning = ({ postId }: { postId?: string }) => {
  const post = postId
    ? usePostsStore((state) => state.getPost(postId))
    : undefined;

  //   TODO: Fetch post if not found in the store.

  if (!post) return null;

  return (
    <div>
      <div className="p-4 flex flex-col gap-2 items-center justify-center">
        <h1 className="text-sm font-medium text-muted-foreground ">
          This is the beginning of the post channel
        </h1>
        <p className="text-xs text-muted-foreground text-center">
          {post.content}
        </p>
      </div>
    </div>
  );
};

export default PostDiscussionBeginning;
