import { Queue } from 'bullmq'
import Redis from 'ioredis'
import { POST_EMBEDDING_QUEUE } from '@shared/constants/workers'

const redis = new Redis({ maxRetriesPerRequest: null });

export const postEmbeddingQueue = new Queue(POST_EMBEDDING_QUEUE, { connection: redis })