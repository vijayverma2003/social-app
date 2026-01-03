"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { usePostsStore } from "@/features/posts/store/postsStore";
import { useProfilesStore } from "@/stores/profilesStore";
import { PostCard } from "@/features/posts/components/PostCard";
import { ConversationPreview } from "@/features/posts/components/ConversationPreview";
import { useShallow } from "zustand/react/shallow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import MainHeader from "../components/MainHeader";
import { getFeed, getRecentPosts } from "@/services/postsService";
import { PostResponse } from "@shared/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useUser } from "@/providers/UserContextProvider";

type TabValue = "feed" | "recent" | "own";

const HomePage = () => {
  const { user } = useUser();
  const { setPosts } = usePostsStore();

  // Use shallow comparison to prevent unnecessary re-renders
  const allPosts = usePostsStore(useShallow((state) => state.posts));
  const getProfile = useProfilesStore((state) => state.getProfile);

  const [previewedPost, setPreviewedPost] = useState<PostResponse | null>(null);
  const [recentPosts, setRecentPosts] = useState<PostResponse[]>([]);
  const [activeTab, setActiveTab] = useState<TabValue>("feed");

  const fetchFeed = useCallback(async () => {
    try {
      const posts = await getFeed();
      if (posts) setPosts(posts);
    } catch (error) {
      console.error("Failed to fetch feed:", error);
    }
  }, [setPosts]);

  const fetchRecentPosts = useCallback(async () => {
    try {
      const posts = await getRecentPosts({ take: 20, offset: 0 });
      if (posts) setRecentPosts(posts);
    } catch (error) {
      console.error("Failed to fetch recent posts:", error);
    }
  }, []);

  // Set up bootstrap to listen for new posts
  useEffect(() => {
    fetchFeed();
    fetchRecentPosts();
  }, [fetchFeed, fetchRecentPosts]);

  // Filter posts based on active tab
  const displayedPosts = useMemo(() => {
    switch (activeTab) {
      case "feed":
        return allPosts;
      case "recent":
        return recentPosts;
      case "own":
        return allPosts.filter((post) => post.userId === user?.id);
      default:
        return allPosts;
    }
  }, [activeTab, allPosts, recentPosts, user?.id]);

  // Memoize handlers to prevent creating new functions on every render
  const handlePreviewChat = useCallback((post: PostResponse) => {
    setPreviewedPost(post);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewedPost(null);
  }, []);

  return (
    <section>
      <MainHeader />
      <div className="flex gap-4 w-full">
        <div className="max-w-2xl w-full">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabValue)}
          >
            <TabsList className="mb-4 bg-transparent">
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="recent">Recent Posts</TabsTrigger>
              <TabsTrigger value="own">Our Posts</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-4">
              {allPosts.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <p>No posts yet. Be the first to post!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      userId={post.userId}
                      onPreviewChat={handlePreviewChat}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="recent" className="space-y-4">
              {recentPosts.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <p>No recent posts yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      userId={post.userId}
                      onPreviewChat={handlePreviewChat}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="own" className="space-y-4">
              {displayedPosts.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <p>You haven't posted anything yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayedPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      userId={post.userId}
                      onPreviewChat={handlePreviewChat}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
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
        </div>
      </div>
    </section>
  );
};

export default HomePage;
