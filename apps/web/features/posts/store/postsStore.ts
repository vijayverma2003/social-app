"use client";

import { create } from "zustand";
import { PostResponse } from "@shared/types";

interface PostsState {
  posts: PostResponse[];
  setPosts: (posts: PostResponse[]) => void;
  addPost: (post: PostResponse) => void;
  updatePost: (post: PostResponse) => void;
  removePost: (postId: string) => void;
  prependPost: (post: PostResponse) => void;
}

export const usePostsStore = create<PostsState>((set) => ({
  posts: [],

  setPosts: (posts) => set({ posts }),

  addPost: (post) =>
    set((state) => {
      if (state.posts.some((p) => p.id === post.id)) return state;
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
      if (state.posts.some((p) => p.id === post.id)) return state;
      return { posts: [post, ...state.posts] };
    }),
}));
