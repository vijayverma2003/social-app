import { POST_CAPTION_QUEUE, POST_EMBEDDING_QUEUE } from "@shared/constants/workers";
import { Queue } from "bullmq";
import { redis } from './redis';

export const postCaptionQueue = new Queue(POST_CAPTION_QUEUE, { connection: redis });
export const postEmbeddingQueue = new Queue(POST_EMBEDDING_QUEUE, { connection: redis });