"use client";

import { useEffect } from "react";
import { usePostActions } from "@/features/posts/hooks/usePostActions";
import { usePostsStore } from "@/features/posts/store/postsStore";
import { usePostsBootstrap } from "@/features/posts/hooks/usePostsBootstrap";
import { PostCard } from "@/features/posts/components/PostCard";

const HomePage = () => {
  const { getFeed } = usePostActions();
  const { postsWithUser } = usePostsStore();

  // Set up bootstrap to listen for new posts
  usePostsBootstrap();

  useEffect(() => {
    // Fetch feed on mount
    getFeed();
  }, [getFeed]);

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-2xl space-y-4">
        {postsWithUser.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p>No posts yet. Be the first to post!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {postsWithUser.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                authorUsername={post.user.username}
                authorDiscriminator={post.user.discriminator}
                authorAvatarUrl={post.user.profile?.avatarURL}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default HomePage;
