import { Prisma } from "@database/postgres/generated/prisma/client";
import {
  CreatePostPayloadSchema,
  GetRecentPostsPayloadSchema,
  JoinPostPayloadSchema,
  UpdatePostPayloadSchema,
} from "../schemas/posts";

import { z } from "zod";

export type PostResponse = Prisma.PostGetPayload<{
  include: {
    attachments: { include: { storageObject: true } };
  };
}>;

export type CreatePostPayload = z.infer<typeof CreatePostPayloadSchema>;
export type UpdatePostPayload = z.infer<typeof UpdatePostPayloadSchema>;
export type JoinPostPayload = z.infer<typeof JoinPostPayloadSchema>;
export type GetRecentPostsPayload = z.infer<typeof GetRecentPostsPayloadSchema>;
