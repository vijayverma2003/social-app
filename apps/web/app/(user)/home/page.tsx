"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard, PostCardSkeleton } from "@/features/posts/components/PostCard";
import { VirtualList } from "@/features/posts/components/VirtualList";
import { usePostsStore } from "@/features/posts/store/postsStore";
import { useUser } from "@/providers/UserContextProvider";
import { usePosts } from "@/hooks/usePosts";
import { PostResponse } from "@shared/types";
import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useShallow } from "zustand/react/shallow";
import MainHeader from "../components/MainHeader";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useVirtualizer, Virtualizer } from "@tanstack/react-virtual";
import { useConversationPreview } from "@/contexts/conversationPreviewContext";
import { Spinner } from "@/components/ui/spinner";

type TabValue = "feed" | "recent" | "own";

const HomePage = () => {
  const {
    feedOffset,
    isFeedLoading,
    hasMoreFeed,
    hasLoadedInitialFeed,
    fetchFeedPage,
  } = usePosts();

  const allPosts = usePostsStore(useShallow((state) => state.posts));

  const [activeTab] = useState<TabValue>("feed");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { openConversation } = useConversationPreview();

  const feedVirtualizer = useVirtualizer({
    count: allPosts.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 400, // Estimated height per post
    overscan: 2, // Number of items to render outside visible area
    enabled: activeTab === "feed" && allPosts.length > 0,
    measureElement:
      typeof window !== "undefined" && navigator.userAgent.indexOf("Firefox") === -1
        ? (element: Element | null) => element?.getBoundingClientRect().height ?? 400
        : undefined,
  });

  // Infinite scroll using IntersectionObserver
  useEffect(() => {
    if (activeTab !== "feed") return;

    const sentinel = document.getElementById("feed-infinite-scroll-sentinel");
    if (!sentinel || !scrollContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (
          entry.isIntersecting &&
          hasMoreFeed &&
          !isFeedLoading &&
          hasLoadedInitialFeed()
        ) {
          fetchFeedPage(feedOffset);
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: "200px",
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [activeTab, fetchFeedPage, feedOffset, hasMoreFeed, isFeedLoading, hasLoadedInitialFeed]);


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
    <section className="h-screen flex flex-col">
      <MainHeader>
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10 py-5 bg-secondary/50 ring-0 focus-visible:ring-0"
            />
          </div>
        </div>
      </MainHeader>
      <div
        ref={scrollContainerRef}
        className="flex gap-4 w-full p-4 overflow-y-auto"
      >
        <div className="flex-1 px-2 max-w-2xl">
          <div className="space-y-4">

            {isFeedLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <PostCardSkeleton key={index} />
                ))}
              </div>
            ) : hasLoadedInitialFeed() && allPosts.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <p>No posts yet. Be the first to post!</p>
              </div>
            ) : (
              <>
                <VirtualList
                  virtualizer={feedVirtualizer as unknown as Virtualizer<HTMLElement, Element>}
                  items={allPosts}
                  renderItem={(post) => (
                    <PostCard
                      post={post}
                      userId={post.userId}
                      onPreviewChat={handlePreviewChat}
                    />
                  )}
                  itemSpacing={16}
                />

                <div
                  id="feed-infinite-scroll-sentinel"
                  className="h-8 flex items-center justify-center text-xs text-muted-foreground"
                >
                  {isFeedLoading && <Spinner />}
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </section >
  );
};

export default HomePage;
