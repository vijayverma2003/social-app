"use client";

import { LandscapePostCard } from "@/features/posts/components/LandscapePostCard";
import { getRecentPosts, fetchPostAuthorProfiles } from "@/services/postsService";
import { PostResponse } from "@shared/types";
import { useCallback, useEffect, useState } from "react";
import { useUser } from "@/providers/UserContextProvider";
import { useConversationPreview } from "@/contexts/conversationPreviewContext";

const RecentsPage = () => {
  const { user } = useUser();
  const [recentPosts, setRecentPosts] = useState<PostResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { openConversation } = useConversationPreview();

  const fetchRecentPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const posts = await getRecentPosts(
        { take: 20, offset: 0 },
        {
          onComplete: async (posts) => {
            // Fetch profiles for post authors
            await fetchPostAuthorProfiles(posts).catch((error) => {
              console.error("Failed to fetch post author profiles:", error);
            });
          },
        }
      );
      if (posts) {
        setRecentPosts(posts);
      }
    } catch (error) {
      console.error("Failed to fetch recent posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentPosts();
  }, [fetchRecentPosts]);

  const handlePreviewChat = useCallback(
    (post: PostResponse) => {
      if (!post.channelId) return;
      openConversation({
        channelId: post.channelId,
        postId: post.id,
        title:
          post.content.slice(0, 30) +
          (post.content.length > 30 ? "..." : ""),
      });
    },
    [openConversation],
  );

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">Recent Posts</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Posts from channels you&apos;ve recently joined
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">Loading recent posts...</p>
            </div>
          ) : recentPosts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">
                No recent posts yet. Join a channel to see posts here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {recentPosts.map((post) => (
                <LandscapePostCard
                  key={post.id}
                  post={post}
                  userId={post.userId}
                  onPreviewChat={handlePreviewChat}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentsPage;
