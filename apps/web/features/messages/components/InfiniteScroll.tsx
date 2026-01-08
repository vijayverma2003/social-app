"use client";

import { useEffect, useRef } from "react";

interface InfiniteScrollProps {
  /**
   * Callback function to load more items when scrolling up
   */
  onLoadMore: () => void;
  /**
   * Whether there are more items to load
   */
  hasMore: boolean;
  /**
   * Whether items are currently being loaded
   */
  isLoading: boolean;
  /**
   * Ref to the scrollable container element
   */
  containerRef: React.RefObject<HTMLElement | null>;
  /**
   * Whether to show the component (useful for conditional rendering)
   */
  enabled?: boolean;
  /**
   * Root margin for IntersectionObserver (default: "200px")
   */
  rootMargin?: string;
  /**
   * Threshold for IntersectionObserver (default: 0.1)
   */
  threshold?: number;
  /**
   * Custom loading message component
   */
  loadingComponent?: React.ReactNode;
  /**
   * Custom end message component (shown when hasMore is false)
   */
  endComponent?: React.ReactNode;
  /**
   * Additional className for the sentinel element
   */
  sentinelClassName?: string;
}

export const InfiniteScroll = ({
  onLoadMore,
  hasMore,
  isLoading,
  containerRef,
  enabled = true,
  rootMargin = "200px",
  threshold = 0.1,
  loadingComponent,
  endComponent,
  sentinelClassName = "h-1 w-full",
}: InfiniteScrollProps) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !hasMore || isLoading) return;

    const sentinel = sentinelRef.current;
    const container = containerRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      {
        root: container,
        rootMargin,
        threshold,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [
    enabled,
    hasMore,
    isLoading,
    containerRef,
    onLoadMore,
    rootMargin,
    threshold,
  ]);

  if (!enabled) return null;

  return (
    <>
      {hasMore && (
        <div
          ref={sentinelRef}
          className={sentinelClassName}
          aria-hidden="true"
        />
      )}
      {isLoading && loadingComponent}
      {!hasMore && endComponent}
    </>
  );
};
