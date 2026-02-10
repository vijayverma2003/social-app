import { usePostsStore } from "@/features/posts/store/postsStore";

const PostChannelHeader = ({ postId }: { postId: string }) => {
  const post = usePostsStore((state) => state.getPost(postId));
  console.log(post);

  //   TODO: Fetch post if not found in the store.

  return (
    <header className="p-3 border-b flex items-center gap-2 justify-between">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">
          {post && post.content
            ? post.content.slice(0, 30) +
              (post.content.length > 30 ? "..." : "")
            : "Post Channel"}
        </p>
      </div>
      <div className="flex items-center gap-2"></div>
    </header>
  );
};

export default PostChannelHeader;
