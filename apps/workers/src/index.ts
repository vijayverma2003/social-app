import { Worker } from 'bullmq'
import { POST_EMBEDDING_QUEUE, POST_CAPTION_QUEUE } from '@shared/constants/workers'
import { createPostEmbeddingJob } from './jobs/posts/generateEmbedding';
import { generatePostCaptionsJob } from './jobs/posts/generateCaptions';
import { redis } from './services/redis';

const embeddingWorker = new Worker(POST_EMBEDDING_QUEUE, async (job) => { await createPostEmbeddingJob(job.data.postId) }, { connection: redis })
embeddingWorker.on('completed', (job) => console.log(`Job ${job.id} completed for post ${job.data.postId}`))
embeddingWorker.on('failed', (job, error) => console.error(`Job ${job?.id} failed with error: ${error}`))

const captionWorker = new Worker(POST_CAPTION_QUEUE, async (job) => { await generatePostCaptionsJob(job.data.postId, redis) }, { connection: redis })
captionWorker.on('completed', (job) => console.log(`Caption job ${job.id} completed for post ${job.data.postId}`))
captionWorker.on('failed', (job, error) => console.error(`Caption job ${job?.id} failed with error: ${error}`))

console.log('Workers started...')