"use client";

import { create } from "zustand";
import { PostData, PostWithUser } from "@shared/schemas/post";

interface PostsState {
  posts: PostData[];
  postsWithUser: PostWithUser[]; // Store posts with user info for display
  setPosts: (posts: PostData[]) => void;
  setPostsWithUser: (posts: PostWithUser[]) => void;
  addPost: (post: PostData) => void;
  updatePost: (post: PostData) => void;
  removePost: (postId: string) => void;
  prependPost: (post: PostData) => void;
}

export const usePostsStore = create<PostsState>((set) => ({
  posts: [],
  postsWithUser: [],
  setPosts: (posts) => set({ posts }),
  setPostsWithUser: (posts) => set({ postsWithUser: posts }),
  addPost: (post) =>
    set((state) => {
      // Check if post already exists
      if (state.posts.some((p) => p.id === post.id)) {
        return state;
      }
      // Add to beginning (most recent first)
      return { posts: [post, ...state.posts] };
    }),
  updatePost: (post) =>
    set((state) => ({
      posts: state.posts.map((p) => (p.id === post.id ? post : p)),
      postsWithUser: state.postsWithUser.map((p) =>
        p.id === post.id ? { ...p, ...post } : p
      ),
    })),
  removePost: (postId) =>
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== postId),
      postsWithUser: state.postsWithUser.filter((p) => p.id !== postId),
    })),
  prependPost: (post) =>
    set((state) => {
      // Check if post already exists
      if (state.posts.some((p) => p.id === post.id)) {
        return state;
      }
      // Add to beginning (most recent first)
      return { posts: [post, ...state.posts] };
    }),
}));
