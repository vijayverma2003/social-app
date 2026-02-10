"use client";

import { create } from "zustand";
import { PostResponse } from "@shared/types";

interface PostsState {
  posts: PostResponse[];
  setPosts: (posts: PostResponse[]) => void;
  appendPosts: (posts: PostResponse[]) => void;
  addPost: (post: PostResponse) => void;
  updatePost: (post: PostResponse) => void;
  removePost: (postId: string) => void;
  prependPost: (post: PostResponse) => void;
  getPost: (postId: string) => PostResponse | undefined;
}

export const usePostsStore = create<PostsState>((set, get) => ({
  posts: [],

  setPosts: (posts) => set({ posts }),

  appendPosts: (posts) =>
    set((state) => {
      // Avoid duplicates when appending
      const existingIds = new Set(state.posts.map((p) => p.id));
      const newPosts = posts.filter((p) => !existingIds.has(p.id));
      return { posts: [...state.posts, ...newPosts] };
    }),

  addPost: (post) =>
    set((state) => {
      if (state.posts.some((p) => p.id === post.id)) return state;
      return { posts: [post, ...state.posts] };
    }),

  updatePost: (post) =>
    set((state) => ({
      posts: state.posts.map((p) => {
        if (p.id === post.id) {
          // Preserve existing isLiked status if the incoming post has isLiked: false
          // This handles broadcasts where isLiked is set to false for all users
          // but we want to preserve the current user's actual like status
          const preserveIsLiked =
            post.isLiked === false && p.isLiked === true ? true : post.isLiked;
          // Preserve existing isBookmarked status if the incoming post has isBookmarked: false
          // This handles broadcasts where isBookmarked is set to false for all users
          // but we want to preserve the current user's actual bookmark status
          const preserveIsBookmarked =
            post.isBookmarked === false && p.isBookmarked === true
              ? true
              : post.isBookmarked;
          return {
            ...post,
            isLiked: preserveIsLiked,
            isBookmarked: preserveIsBookmarked,
          };
        }
        return p;
      }),
    })),

  removePost: (postId) =>
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== postId),
    })),

  prependPost: (post) =>
    set((state) => {
      if (state.posts.some((p) => p.id === post.id)) return state;
      return { posts: [post, ...state.posts] };
    }),

  getPost: (postId: string) => get().posts.find((p) => p.id === postId),
}));
