"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversationPreview } from "@/features/posts/components/ConversationPreview";
import { PostCard } from "@/features/posts/components/PostCard";
import { usePostsStore } from "@/features/posts/store/postsStore";
import { useUser } from "@/providers/UserContextProvider";
import { getFeed, getRecentPosts } from "@/services/postsService";
import { PostResponse } from "@shared/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import MainHeader from "../components/MainHeader";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type TabValue = "feed" | "recent" | "own";

const HomePage = () => {
  const { user } = useUser();
  const { setPosts, appendPosts } = usePostsStore();

  // Use shallow comparison to prevent unnecessary re-renders
  const allPosts = usePostsStore(useShallow((state) => state.posts));

  const [previewedPost, setPreviewedPost] = useState<PostResponse | null>(null);
  const [recentPosts, setRecentPosts] = useState<PostResponse[]>([]);
  const [activeTab, setActiveTab] = useState<TabValue>("feed");
  const [feedOffset, setFeedOffset] = useState(0);
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [hasMoreFeed, setHasMoreFeed] = useState(true);
  const hasLoadedInitialFeedRef = useRef(false);

  const fetchFeedPage = useCallback(
    async (offset: number) => {
      // Avoid duplicate requests
      if (isFeedLoading || !hasMoreFeed) return;

      try {
        setIsFeedLoading(true);
        const take = 4;
        const posts = await getFeed({ take, offset });

        if (offset === 0) setPosts(posts);
        else appendPosts(posts);

        if (!posts || posts.length < take) setHasMoreFeed(false);

        setFeedOffset((prev) => {
          console.log(prev, prev + posts.length);
          return prev + posts.length;
        });
      } catch (error) {
        console.error("Failed to fetch feed:", error);
      } finally {
        setIsFeedLoading(false);
      }
    },
    [appendPosts, hasMoreFeed, isFeedLoading, setPosts]
  );

  const fetchRecentPosts = useCallback(async () => {
    try {
      const posts = await getRecentPosts({ take: 20, offset: 0 });
      if (posts) setRecentPosts(posts);
    } catch (error) {
      console.error("Failed to fetch recent posts:", error);
    }
  }, []);

  // Initial load for feed and recent posts (guarded against React StrictMode double-invoke)
  useEffect(() => {
    if (hasLoadedInitialFeedRef.current) return;
    hasLoadedInitialFeedRef.current = true;
    console.log("Fetching data from useEffect");
    fetchFeedPage(0);
    fetchRecentPosts();
  }, [fetchFeedPage, fetchRecentPosts]);

  // Infinite scroll using IntersectionObserver
  useEffect(() => {
    if (activeTab !== "feed") return;

    const sentinel = document.getElementById("feed-infinite-scroll-sentinel");
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (
          entry.isIntersecting &&
          hasMoreFeed &&
          !isFeedLoading &&
          hasLoadedInitialFeedRef.current
        ) {
          fetchFeedPage(feedOffset);
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [activeTab, fetchFeedPage, feedOffset, hasMoreFeed, isFeedLoading]);

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
    <section className="h-screen flex flex-col bg-secondary/20">
      <MainHeader>
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10 py-5 border border-border bg-secondary/50 ring-0 focus-visible:ring-0"
            />
          </div>
        </div>
      </MainHeader>
      <div className="flex gap-4 w-full p-4 overflow-y-auto">
        <div className="max-w-2xl w-full">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabValue)}
          >
            <TabsList className="mb-4 bg-transparent">
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="recent">Recent Posts</TabsTrigger>
              <TabsTrigger value="own">Your Posts</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-4">
              {allPosts.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <p>No posts yet. Be the first to post!</p>
                </div>
              ) : (
                <>
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

                  <div
                    id="feed-infinite-scroll-sentinel"
                    className="h-8 flex items-center justify-center text-xs text-muted-foreground"
                  >
                    {isFeedLoading
                      ? "Loading more..."
                      : hasMoreFeed
                      ? "Scroll to load more"
                      : "No more posts"}
                  </div>
                </>
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

        <div className="flex flex-col gap-4 flex-1 min-w-0 sticky top-15 h-[calc(100vh-6rem)] overflow-y-auto">
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
