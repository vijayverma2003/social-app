import { POST_EVENTS } from "@shared/socketEvents";
import { socketService } from "./socketService";
import {
  CreatePostPayload,
  GetFeedPayload,
  GetRecentPostsPayload,
  DeletePostPayload,
  PostResponse,
  LikePostPayload,
  RemoveLikePayload,
} from "@shared/types";
import { ClientToServerEvents } from "@shared/types/socket";
import { fetchUserProfiles } from "./profilesService";

type CreatePostCallback = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.CREATE]
>[1];

type GetFeedCallback = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.GET_FEED]
>[1];

type GetRecentPostsCallback = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.GET_RECENT_POSTS]
>[1];

type DeletePostCallback = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.DELETE]
>[1];

type LikePostCallback = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.LIKE]
>[1];

type RemoveLikeCallback = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.UNLIKE]
>[1];

/**
 * Fetch profiles for post authors
 * Extracts unique user IDs from posts and fetches their profiles
 * @param posts - Array of posts to extract user IDs from
 */
const fetchPostAuthorProfiles = async (
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

/**
 * Create a new post
 * @param payload - { content: string, storageObjectIds?: string[] }
 * @returns Promise that resolves with the created post or rejects with error
 */
export const createPost = (
  payload: CreatePostPayload,
  options?: {
    onComplete?: (post: PostResponse) => void;
    onError?: (error: string) => void;
  }
): Promise<PostResponse> => {
  return new Promise<PostResponse>((resolve, reject) => {
    socketService.emit(POST_EVENTS.CREATE, payload, ((response) => {
      if (response.error) {
        options?.onError?.(response.error);
        reject(new Error(response.error));
      } else if (response.success && response.data) {
        options?.onComplete?.(response.data);
        resolve(response.data);
      } else {
        options?.onError?.("Failed to create post");
        reject(new Error("Failed to create post"));
      }
    }) as CreatePostCallback);
  });
};

/**
 * Get recent posts for the main feed with pagination
 * Also fetches profiles of post authors and stores them
 * @param payload - { take?: number; offset?: number } - take: number of posts (default 4, max 20), offset: skip count (default 0)
 * @returns Promise that resolves with array of posts or rejects with error
 */
export const getFeed = (
  payload: GetFeedPayload = { take: 4, offset: 0 }
): Promise<PostResponse[]> => {
  console.log("Get Feed", payload);
  return new Promise<PostResponse[]>((resolve, reject) => {
    const callback: GetFeedCallback = (response) => {
      console.log("getFeed callback invoked with response:", response);
      if (response.error) reject(new Error(response.error));
      else if (response.success && response.data) {
        console.log(
          "getFeed success, posts count:",
          response.data.length,
          payload.offset
        );
        const posts = response.data;

        // Fetch profiles for post authors (async, but don't block resolution)
        fetchPostAuthorProfiles(posts).catch((error) => {
          console.error("Failed to fetch post author profiles:", error);
        });

        resolve(posts);
      } else {
        reject(new Error("Failed to get feed"));
      }
    };

    socketService.emit(POST_EVENTS.GET_FEED, payload, callback);
  });
};

/**
 * Get recent posts from the user's RecentPosts with pagination
 * Also fetches profiles of post authors and stores them
 * @param payload - { take?: number; offset?: number } - take: number of posts (default 5, max 20), offset: skip count (default 0)
 * @returns Promise that resolves with array of recent posts or rejects with error
 */
export const getRecentPosts = (
  payload: GetRecentPostsPayload = { take: 5, offset: 0 }
): Promise<PostResponse[]> => {
  return new Promise<PostResponse[]>((resolve, reject) => {
    socketService.emit(POST_EVENTS.GET_RECENT_POSTS, payload, (async (
      response
    ) => {
      if (response.error) {
        reject(new Error(response.error));
      } else if (response.success && response.data) {
        const posts = response.data;

        // Fetch profiles for post authors
        await fetchPostAuthorProfiles(posts);

        resolve(posts);
      } else {
        reject(new Error("Failed to get recent posts"));
      }
    }) as GetRecentPostsCallback);
  });
};

/**
 * Delete a post
 * @param payload - { postId: string }
 * @param options - Optional callbacks for success and error handling
 * @returns Promise that resolves with the deleted post ID or rejects with error
 */
export const deletePost = (
  payload: DeletePostPayload,
  options?: {
    onComplete?: (data: { postId: string }) => void;
    onError?: (error: string) => void;
  }
): Promise<{ postId: string }> => {
  return new Promise<{ postId: string }>((resolve, reject) => {
    socketService.emit(POST_EVENTS.DELETE, payload, (response) => {
      if (response.error) {
        options?.onError?.(response.error);
        reject(new Error(response.error));
      } else if (response.success && response.data) {
        options?.onComplete?.(response.data);
        resolve(response.data);
      } else {
        options?.onError?.("Failed to delete post");
        reject(new Error("Failed to delete post"));
      }
    });
  });
};

/**
 * Like a post
 * @param payload - { postId: string }
 * @param options - Optional callbacks for success and error handling
 * @returns Promise that resolves with the updated post or rejects with error
 */
export const likePost = (
  payload: LikePostPayload,
  options?: {
    onComplete?: (post: PostResponse) => void;
    onError?: (error: string) => void;
  }
): Promise<PostResponse> => {
  return new Promise<PostResponse>((resolve, reject) => {
    socketService.emit(POST_EVENTS.LIKE, payload, ((response) => {
      if (response.error) {
        options?.onError?.(response.error);
        reject(new Error(response.error));
      } else if (response.success && response.data) {
        options?.onComplete?.(response.data);
        resolve(response.data);
      } else {
        const message = "Failed to like post";
        options?.onError?.(message);
        reject(new Error(message));
      }
    }) as LikePostCallback);
  });
};

/**
 * Remove like from a post
 * @param payload - { postId: string }
 * @param options - Optional callbacks for success and error handling
 * @returns Promise that resolves with the updated post or rejects with error
 */
export const removeLike = (
  payload: RemoveLikePayload,
  options?: {
    onComplete?: (post: PostResponse) => void;
    onError?: (error: string) => void;
  }
): Promise<PostResponse> => {
  return new Promise<PostResponse>((resolve, reject) => {
    socketService.emit(POST_EVENTS.UNLIKE, payload, ((response) => {
      if (response.error) {
        options?.onError?.(response.error);
        reject(new Error(response.error));
      } else if (response.success && response.data) {
        options?.onComplete?.(response.data);
        resolve(response.data);
      } else {
        const message = "Failed to remove like";
        options?.onError?.(message);
        reject(new Error(message));
      }
    }) as RemoveLikeCallback);
  });
};
