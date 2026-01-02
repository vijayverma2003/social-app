import { POST_EVENTS } from "@shared/socketEvents";
import { socketService } from "./socket";
import {
  CreatePostPayload,
  PostResponse,
  GetRecentPostsPayload,
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

/**
 * Create a new post
 * @param payload - { content: string, storageObjectIds?: string[] }
 * @returns Promise that resolves with the created post or rejects with error
 */
export const createPost = (
  payload: CreatePostPayload
): Promise<PostResponse> => {
  return new Promise<PostResponse>((resolve, reject) => {
    socketService.emit(POST_EVENTS.CREATE, payload, ((response) => {
      if (response.error) {
        reject(new Error(response.error));
      } else if (response.success && response.data) {
        resolve(response.data);
      } else {
        reject(new Error("Failed to create post"));
      }
    }) as CreatePostCallback);
  });
};

/**
 * Get the 20 most recent posts (feed)
 * Also fetches profiles of post authors and stores them
 * @returns Promise that resolves with array of posts or rejects with error
 */
export const getFeed = (): Promise<PostResponse[]> => {
  return new Promise<PostResponse[]>((resolve, reject) => {
    socketService.emit(POST_EVENTS.GET_FEED, {}, (async (response) => {
      if (response.error) {
        reject(new Error(response.error));
      } else if (response.success && response.data) {
        const posts = response.data;

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

        resolve(posts);
      } else {
        reject(new Error("Failed to get feed"));
      }
    }) as GetFeedCallback);
  });
};

/**
 * Get recent posts from the user's RecentPosts with pagination
 * @param payload - { take?: number; offset?: number } - take: number of posts (default 5, max 20), offset: skip count (default 0)
 * @returns Promise that resolves with array of recent posts or rejects with error
 */
export const getRecentPosts = (
  payload: GetRecentPostsPayload = { take: 5, offset: 0 }
): Promise<PostResponse[]> => {
  return new Promise<PostResponse[]>((resolve, reject) => {
    socketService.emit(POST_EVENTS.GET_RECENT_POSTS, payload, ((response) => {
      if (response.error) {
        reject(new Error(response.error));
      } else if (response.success && response.data) {
        resolve(response.data);
      } else {
        reject(new Error("Failed to get recent posts"));
      }
    }) as GetRecentPostsCallback);
  });
};
