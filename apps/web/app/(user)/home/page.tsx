"use client";

import { useEffect, useState, useCallback } from "react";
import { usePostActions } from "@/features/posts/hooks/usePostActions";
import { usePostsStore } from "@/features/posts/store/postsStore";
import { usePostsBootstrap } from "@/features/posts/hooks/usePostsBootstrap";
import { PostCard } from "@/features/posts/components/PostCard";
import { ConversationPreview } from "@/features/posts/components/ConversationPreview";
import { PostData, PostWithUser } from "@shared/schemas/post";
import { useShallow } from "zustand/react/shallow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

const HomePage = () => {
  const { getFeed, getRecentPosts } = usePostActions();

  // Use shallow comparison to prevent unnecessary re-renders
  const postsWithUser = usePostsStore(
    useShallow((state) => state.postsWithUser)
  );

  const [previewedPost, setPreviewedPost] = useState<PostData | null>(null);
  const [recentPosts, setRecentPosts] = useState<PostWithUser[]>([]);

  // Set up bootstrap to listen for new posts
  usePostsBootstrap();

  useEffect(() => {
    getFeed();
    // Fetch 5 most recent posts for the current user
    getRecentPosts({ take: 5, offset: 0 }, (posts) => {
      if (posts) {
        setRecentPosts(posts);
      }
    });
  }, [getFeed, getRecentPosts]);

  // Memoize handlers to prevent creating new functions on every render
  const handlePreviewChat = useCallback((post: PostData) => {
    setPreviewedPost(post);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewedPost(null);
  }, []);

  return (
    <div className="flex gap-4 w-full ">
      <div className="max-w-2xl w-full">
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

      <div className="flex flex-col gap-4 flex-1 min-w-0 sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto">
        {/* Conversation Preview */}
        {previewedPost && previewedPost.channelId && (
          <ConversationPreview
            channelId={previewedPost.channelId}
            postId={previewedPost.id}
            onClose={handleClosePreview}
            title={
              previewedPost.content.slice(0, 30) +
              (previewedPost.content.length > 30 ? "..." : "")
            }
          />
        )}
        {/* Recent Posts */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground px-1">
            Recent Posts
          </p>
          {recentPosts.length === 0 ? (
            <p className="text-xs text-muted-foreground px-1 pb-1">
              No recent posts yet.
            </p>
          ) : (
            recentPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-3xl bg-secondary/50 flex flex-col gap-2"
              >
                <header className="flex items-start gap-2">
                  <Avatar size="sm">
                    <AvatarImage
                      src={post.user.profile?.avatarURL || undefined}
                    />
                    <AvatarFallback>
                      {post.user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {post.user.username}#{post.user.discriminator}
                    </p>
                  </div>
                </header>
                <div>
                  <p className="text-xs">
                    {post.content.slice(0, 100) +
                      (post.content.length > 100 ? "..." : "")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(post.createdAt)} ago
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
