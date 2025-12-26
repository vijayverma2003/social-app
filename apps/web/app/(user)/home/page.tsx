"use client";

import { useEffect, useState, useCallback } from "react";
import { usePostActions } from "@/features/posts/hooks/usePostActions";
import { usePostsStore } from "@/features/posts/store/postsStore";
import { usePostsBootstrap } from "@/features/posts/hooks/usePostsBootstrap";
import { PostCard } from "@/features/posts/components/PostCard";
import { ConversationPreview } from "@/features/posts/components/ConversationPreview";
import { PostData } from "@shared/schemas/post";
import { useShallow } from "zustand/react/shallow";

const HomePage = () => {
  const { getFeed } = usePostActions();

  // Use shallow comparison to prevent unnecessary re-renders
  const postsWithUser = usePostsStore(
    useShallow((state) => state.postsWithUser)
  );

  const [previewedPost, setPreviewedPost] = useState<PostData | null>(null);

  // Set up bootstrap to listen for new posts
  usePostsBootstrap();

  useEffect(() => {
    getFeed();
  }, [getFeed]);

  // Memoize handlers to prevent creating new functions on every render
  const handlePreviewChat = useCallback((post: PostData) => {
    setPreviewedPost(post);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewedPost(null);
  }, []);

  return (
    <div className="flex gap-4 h-full w-full">
      {/* Posts Feed - Left Side */}
      <div className="overflow-y-auto no-scrollbar basis-2xl">
        <div className="space-y-4">
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
                  onPreviewChat={handlePreviewChat}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Conversation Preview - Right Side */}
      {previewedPost && previewedPost.channelId && (
        <div className="grow">
          <ConversationPreview
            channelId={previewedPost.channelId}
            postId={previewedPost.id}
            onClose={handleClosePreview}
          />
        </div>
      )}
    </div>
  );
};

export default HomePage;
