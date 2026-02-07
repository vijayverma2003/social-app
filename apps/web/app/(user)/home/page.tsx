"use client";

import { PostCard, PostCardSkeleton } from "@/features/posts/components/PostCard";
import { VirtualList } from "@/features/posts/components/VirtualList";
import { usePostsStore } from "@/features/posts/store/postsStore";
import { usePosts } from "@/hooks/usePosts";
import { PostResponse } from "@shared/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import MainHeader from "../components/MainHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useVirtualizer, Virtualizer } from "@tanstack/react-virtual";
import { useConversationPreview } from "@/contexts/conversationPreviewContext";
import { searchPosts, fetchPostAuthorProfiles } from "@/services/postsService";
import { motion } from "framer-motion";

type TabValue = "feed" | "recent" | "own";

const feedContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
};

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

  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PostResponse[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

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

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = searchQuery.trim();
      if (!q) {
        setSubmittedQuery("");
        setSearchResults([]);
        return;
      }
      setSubmittedQuery(q);
      setIsSearchLoading(true);
      searchPosts({ query: q, take: 20, offset: 0 })
        .then((posts) => {
          setSearchResults(posts);
          fetchPostAuthorProfiles(posts).catch(() => { });
        })
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearchLoading(false));
    },
    [searchQuery],
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSubmittedQuery("");
    setSearchResults([]);
  }, []);

  const isShowingSearch = submittedQuery.length > 0;

  return (
    <section className="h-screen flex flex-col">
      <MainHeader>
        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-2xl flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-5 bg-secondary/50 ring-0 focus-visible:ring-0"
              aria-label="Search posts"
            />
          </div>
          {(searchQuery.trim().length > 0 || isShowingSearch) && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <X className="size-4" />
            </Button>
          )}
        </form>
      </MainHeader>
      <div
        ref={scrollContainerRef}
        className="flex gap-4 w-full p-4 overflow-y-auto"
      >
        <div className="flex-1 px-2 max-w-2xl">
          <div className="space-y-4">
            {isShowingSearch ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Search results for &quot;{submittedQuery}&quot;
                </p>
                {isSearchLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <PostCardSkeleton key={index} />
                    ))}
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <p>No posts match your search.</p>
                  </div>
                ) : (
                  <motion.div
                    variants={feedContainerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4"
                  >
                    {searchResults.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        userId={post.userId}
                        onPreviewChat={handlePreviewChat}
                      />
                    ))}
                  </motion.div>
                )}
              </>
            ) : (
              <>
                {(hasLoadedInitialFeed() && !isFeedLoading && allPosts.length === 0) ? (
                  <div className="text-center text-muted-foreground py-12">
                    <p>No posts yet. Be the first to post!</p>
                  </div>
                ) : (
                  <>
                    <motion.div
                      variants={feedContainerVariants}
                      initial="hidden"
                      animate="visible"
                    >
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
                    </motion.div>
                  </>
                )}

                {isFeedLoading && (
                  <div className="space-y-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <PostCardSkeleton key={index} />
                    ))}
                  </div>
                )}

                <div
                  id="feed-infinite-scroll-sentinel"
                  className="flex items-center justify-center text-xs text-muted-foreground w-full"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </section >
  );
};

export default HomePage;
