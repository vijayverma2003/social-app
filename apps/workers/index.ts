import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { POST_EMBEDDING_QUEUE } from '@shared/constants/workers'
import { createPostEmbeddingJob } from './jobs/posts';

const redis = new Redis({ maxRetriesPerRequest: null });

const worker = new Worker(POST_EMBEDDING_QUEUE, async (job) => { await createPostEmbeddingJob(job.data.postId) }, { connection: redis })

worker.on('completed', (job) => console.log(`Job ${job.id} completed for post ${job.data.postId}`))
worker.on('failed', (job, error) => console.error(`Job ${job?.id} failed with error: ${error}`))

console.log('Workers started...')