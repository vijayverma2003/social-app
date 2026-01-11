import { Prisma } from "@database/postgres/generated/prisma/client";
import {
  CreatePostPayloadSchema,
  GetFeedPayloadSchema,
  GetRecentPostsPayloadSchema,
  JoinPostPayloadSchema,
  UpdatePostPayloadSchema,
  DeletePostPayloadSchema,
} from "../schemas/posts";

import { z } from "zod";

export type PostResponse = Prisma.PostGetPayload<{
  include: {
    attachments: { include: { storageObject: true } };
  };
}>;

export type CreatePostPayload = z.infer<typeof CreatePostPayloadSchema>;
export type UpdatePostPayload = z.infer<typeof UpdatePostPayloadSchema>;
export type DeletePostPayload = z.infer<typeof DeletePostPayloadSchema>;
export type JoinPostPayload = z.infer<typeof JoinPostPayloadSchema>;
export type GetRecentPostsPayload = z.infer<typeof GetRecentPostsPayloadSchema>;
export type GetFeedPayload = z.infer<typeof GetFeedPayloadSchema>;
