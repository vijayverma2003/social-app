"use client";

import { create } from "zustand";
import { PostData } from "@shared/schemas/post";

interface PostsState {
  posts: PostData[];
  setPosts: (posts: PostData[]) => void;
  addPost: (post: PostData) => void;
  updatePost: (post: PostData) => void;
  removePost: (postId: string) => void;
  prependPost: (post: PostData) => void;
}

export const usePostsStore = create<PostsState>((set) => ({
  posts: [],
  setPosts: (posts) => set({ posts }),
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
    })),
  removePost: (postId) =>
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== postId),
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
