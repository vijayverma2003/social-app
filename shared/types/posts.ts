import { Prisma } from "@database/postgres/generated/prisma/client";
import {
  CreatePostPayloadSchema,
  GetFeedPayloadSchema,
  GetRecentPostsPayloadSchema,
  JoinPostPayloadSchema,
  UpdatePostPayloadSchema,
  DeletePostPayloadSchema,
  LikePostPayloadSchema,
  RemoveLikePayloadSchema,
  BookmarkPostPayloadSchema,
  RemoveBookmarkPayloadSchema,
} from "../schemas/posts";

import { z } from "zod";

export type PostResponse = Prisma.PostGetPayload<{
  include: {
    attachments: { include: { storageObject: true } };
  };
}> & { likes: number; isLiked: boolean; isBookmarked: boolean };

export type CreatePostPayload = z.infer<typeof CreatePostPayloadSchema>;
export type UpdatePostPayload = z.infer<typeof UpdatePostPayloadSchema>;
export type DeletePostPayload = z.infer<typeof DeletePostPayloadSchema>;
export type JoinPostPayload = z.infer<typeof JoinPostPayloadSchema>;
export type GetRecentPostsPayload = z.infer<typeof GetRecentPostsPayloadSchema>;
export type GetFeedPayload = z.infer<typeof GetFeedPayloadSchema>;
export type LikePostPayload = z.infer<typeof LikePostPayloadSchema>;
export type RemoveLikePayload = z.infer<typeof RemoveLikePayloadSchema>;
export type BookmarkPostPayload = z.infer<typeof BookmarkPostPayloadSchema>;
export type RemoveBookmarkPayload = z.infer<typeof RemoveBookmarkPayloadSchema>;
