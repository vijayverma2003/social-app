import { usePostsStore } from "@/features/posts/store/postsStore";
import ProfileCard from "../../components/ProfileCard";

const PostChannelSidebar = ({ postId }: { postId: string }) => {
  const post = usePostsStore((state) => state.getPost(postId));

  return (
    <div className="p-4">
      {post && <ProfileCard variant="popover" userId={post.userId} />}
    </div>
  );
};

export default PostChannelSidebar;
