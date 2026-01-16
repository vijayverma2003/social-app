"use client";

import { usePostsStore } from "@/features/posts/store/postsStore";
import {
  getFeed,
  getRecentPosts,
  fetchPostAuthorProfiles,
} from "@/services/postsService";
import { PostResponse } from "@shared/types";
import { useCallback, useEffect, useRef, useState } from "react";

export const usePosts = () => {
  const { setPosts, appendPosts } = usePostsStore();
  const [recentPosts, setRecentPosts] = useState<PostResponse[]>([]);
  const [feedOffset, setFeedOffset] = useState(0);
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [hasMoreFeed, setHasMoreFeed] = useState(true);
  const hasLoadedInitialFeedRef = useRef(false);

  const onFetchPostsComplete = useCallback((posts: PostResponse[]) => {
    // Fetch profiles for post authors
    fetchPostAuthorProfiles(posts).catch((error) => {
      console.error("Failed to fetch post author profiles:", error);
    });
  }, []);

  const fetchFeedPage = useCallback(
    async (offset: number) => {
      // Avoid duplicate requests
      if (isFeedLoading || !hasMoreFeed) return;

      try {
        setIsFeedLoading(true);
        const take = 4;
        const posts = await getFeed(
          { take, offset },
          { onComplete: onFetchPostsComplete }
        );

        if (offset === 0) setPosts(posts);
        else appendPosts(posts);

        if (!posts || posts.length < take) setHasMoreFeed(false);

        setFeedOffset((prev) => {
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
      const posts = await getRecentPosts(
        { take: 20, offset: 0 },
        { onComplete: onFetchPostsComplete }
      );
      if (posts) setRecentPosts(posts);
    } catch (error) {
      console.error("Failed to fetch recent posts:", error);
    }
  }, []);

  // Initial load for feed and recent posts (guarded against React StrictMode double-invoke)
  useEffect(() => {
    if (hasLoadedInitialFeedRef.current) return;
    hasLoadedInitialFeedRef.current = true;

    fetchFeedPage(0);
    fetchRecentPosts();
  }, [fetchFeedPage, fetchRecentPosts]);

  return {
    recentPosts,
    feedOffset,
    isFeedLoading,
    hasMoreFeed,
    hasLoadedInitialFeed: () => hasLoadedInitialFeedRef.current,
    fetchFeedPage,
    fetchRecentPosts,
  };
};
