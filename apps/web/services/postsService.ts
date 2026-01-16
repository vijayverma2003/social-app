import { usePostsStore } from "@/features/posts/store/postsStore";
import { POST_EVENTS } from "@shared/socketEvents";
import {
  BookmarkPostPayload,
  CreatePostPayload,
  DeletePostPayload,
  GetFeedPayload,
  GetRecentPostsPayload,
  LikePostPayload,
  PostResponse,
  RemoveBookmarkPayload,
  RemoveLikePayload,
} from "@shared/types";
import { ServerToClientEvents } from "@shared/types/socket";
import { fetchUserProfiles } from "./profilesService";
import { ServiceOptions, socketService } from "./socketService";

/**
 * Fetch profiles for post authors
 * Extracts unique user IDs from posts and fetches their profiles
 * @param posts - Array of posts to extract user IDs from
 */
export const fetchPostAuthorProfiles = async (
  posts: PostResponse[]
): Promise<void> => {
  // Extract unique user IDs from posts
  const userIds = [
    ...new Set(posts.map((post) => post.userId).filter(Boolean)),
  ];

  // Fetch profiles for post authors (this will check store first)
  if (userIds.length > 0) {
    try {
      await fetchUserProfiles({ userIds });
    } catch (error) {
      console.error("Failed to fetch post author profiles:", error);
    }
  }
};

class PostsService {
  /**
   * Create a new post
   * @param payload - { content: string, storageObjectIds?: string[] }
   * @param options - Optional callbacks for success and error handling
   * @returns Promise that resolves with the created post or rejects with error
   */
  createPost(
    payload: CreatePostPayload,
    options?: ServiceOptions<PostResponse>
  ): Promise<PostResponse> {
    return socketService.emitWithResponse<
      typeof POST_EVENTS.CREATE,
      PostResponse
    >({
      event: POST_EVENTS.CREATE,
      payload,
      defaultErrorMessage: "Failed to create post",
      options,
    });
  }

  /**
   * Get recent posts for the main feed with pagination
   * @param payload - { take?: number; offset?: number } - take: number of posts (default 4, max 20), offset: skip count (default 0)
   * @param options - Optional callbacks for success and error handling
   * @returns Promise that resolves with array of posts or rejects with error
   */
  getFeed(
    payload: GetFeedPayload = { take: 4, offset: 0 },
    options?: ServiceOptions<PostResponse[]>
  ): Promise<PostResponse[]> {
    return socketService.emitWithResponse<
      typeof POST_EVENTS.GET_FEED,
      PostResponse[]
    >({
      event: POST_EVENTS.GET_FEED,
      payload,
      defaultErrorMessage: "Failed to get feed",
      options,
    });
  }

  /**
   * Get recent posts from the user's RecentPosts with pagination
   * @param payload - { take?: number; offset?: number } - take: number of posts (default 5, max 20), offset: skip count (default 0)
   * @param options - Optional callbacks for success and error handling
   * @returns Promise that resolves with array of recent posts or rejects with error
   */
  getRecentPosts(
    payload: GetRecentPostsPayload = { take: 5, offset: 0 },
    options?: ServiceOptions<PostResponse[]>
  ): Promise<PostResponse[]> {
    return socketService.emitWithResponse<
      typeof POST_EVENTS.GET_RECENT_POSTS,
      PostResponse[]
    >({
      event: POST_EVENTS.GET_RECENT_POSTS,
      payload,
      defaultErrorMessage: "Failed to get recent posts",
      options,
    });
  }

  /**
   * Delete a post
   * @param payload - { postId: string }
   * @param options - Optional callbacks for success and error handling
   * @returns Promise that resolves with the deleted post ID or rejects with error
   */
  deletePost(
    payload: DeletePostPayload,
    options?: ServiceOptions<{ postId: string }>
  ): Promise<{ postId: string }> {
    return socketService.emitWithResponse<
      typeof POST_EVENTS.DELETE,
      { postId: string }
    >({
      event: POST_EVENTS.DELETE,
      payload,
      defaultErrorMessage: "Failed to delete post",
      options,
    });
  }

  /**
   * Like a post
   * @param payload - { postId: string }
   * @param options - Optional callbacks for success and error handling
   * @returns Promise that resolves with the updated post or rejects with error
   */
  likePost(
    payload: LikePostPayload,
    options?: ServiceOptions<PostResponse>
  ): Promise<PostResponse> {
    return socketService.emitWithResponse<
      typeof POST_EVENTS.LIKE,
      PostResponse
    >({
      event: POST_EVENTS.LIKE,
      payload,
      defaultErrorMessage: "Failed to like post",
      options,
    });
  }

  /**
   * Remove like from a post
   * @param payload - { postId: string }
   * @param options - Optional callbacks for success and error handling
   * @returns Promise that resolves with the updated post or rejects with error
   */
  removeLike(
    payload: RemoveLikePayload,
    options?: ServiceOptions<PostResponse>
  ): Promise<PostResponse> {
    return socketService.emitWithResponse<
      typeof POST_EVENTS.UNLIKE,
      PostResponse
    >({
      event: POST_EVENTS.UNLIKE,
      payload,
      defaultErrorMessage: "Failed to remove like",
      options,
    });
  }

  /**
   * Bookmark a post
   * @param payload - { postId: string }
   * @param options - Optional callbacks for success and error handling
   * @returns Promise that resolves with the updated post or rejects with error
   */
  bookmarkPost(
    payload: BookmarkPostPayload,
    options?: ServiceOptions<PostResponse>
  ): Promise<PostResponse> {
    return socketService.emitWithResponse<
      typeof POST_EVENTS.BOOKMARK,
      PostResponse
    >({
      event: POST_EVENTS.BOOKMARK,
      payload,
      defaultErrorMessage: "Failed to bookmark post",
      options,
    });
  }

  /**
   * Remove bookmark from a post
   * @param payload - { postId: string }
   * @param options - Optional callbacks for success and error handling
   * @returns Promise that resolves with the updated post or rejects with error
   */
  removeBookmark(
    payload: RemoveBookmarkPayload,
    options?: ServiceOptions<PostResponse>
  ): Promise<PostResponse> {
    return socketService.emitWithResponse<
      typeof POST_EVENTS.UNBOOKMARK,
      PostResponse
    >({
      event: POST_EVENTS.UNBOOKMARK,
      payload,
      defaultErrorMessage: "Failed to remove bookmark",
      options,
    });
  }

  /**
   * Get socket event handlers for post events
   * @returns Object containing all post event handlers
   */
  getPostEventHandlers() {
    const { prependPost, updatePost, removePost } = usePostsStore.getState();

    const handlePostCreated = (
      post: Parameters<ServerToClientEvents[typeof POST_EVENTS.CREATED]>[0]
    ) => {
      prependPost(post);
    };

    const handlePostUpdated = (
      post: Parameters<ServerToClientEvents[typeof POST_EVENTS.UPDATED]>[0]
    ) => {
      updatePost(post);
    };

    const handlePostLiked = (
      post: Parameters<ServerToClientEvents[typeof POST_EVENTS.LIKED]>[0]
    ) => {
      updatePost(post);
    };

    const handlePostUnliked = (
      post: Parameters<ServerToClientEvents[typeof POST_EVENTS.UNLIKED]>[0]
    ) => {
      updatePost(post);
    };

    const handlePostBookmarked = (
      post: Parameters<ServerToClientEvents[typeof POST_EVENTS.BOOKMARKED]>[0]
    ) => {
      updatePost(post);
    };

    const handlePostUnbookmarked = (
      post: Parameters<ServerToClientEvents[typeof POST_EVENTS.UNBOOKMARKED]>[0]
    ) => {
      updatePost(post);
    };

    const handlePostDeleted = (
      data: Parameters<ServerToClientEvents[typeof POST_EVENTS.DELETED]>[0]
    ) => {
      removePost(data.postId);
    };

    return {
      handlePostCreated,
      handlePostUpdated,
      handlePostLiked,
      handlePostUnliked,
      handlePostBookmarked,
      handlePostUnbookmarked,
      handlePostDeleted,
    };
  }
}

// Create singleton instance
export const postsService = new PostsService();

// Export functions for backward compatibility
export const createPost = postsService.createPost.bind(postsService);
export const getFeed = postsService.getFeed.bind(postsService);
export const getRecentPosts = postsService.getRecentPosts.bind(postsService);
export const deletePost = postsService.deletePost.bind(postsService);
export const likePost = postsService.likePost.bind(postsService);
export const removeLike = postsService.removeLike.bind(postsService);
export const bookmarkPost = postsService.bookmarkPost.bind(postsService);
export const removeBookmark = postsService.removeBookmark.bind(postsService);
