import type Redis from "ioredis";
import prisma from "@database/postgres";
import {
    googleGenAIService,
    SUPPORTED_IMAGE_MIME_TYPES,
    type SupportedImageMimeType,
} from "../services/google-genai";
import { imageUrlToBase64 } from "../services/utils";

const SUPPORTED_MIME_SET = new Set<string>(
    Object.values(SUPPORTED_IMAGE_MIME_TYPES)
);
const CAPTION_MAX_LENGTH = 1000;

const CAPTIONING_KEY_PREFIX = "captioning:storageObject:";
const CAPTIONING_LOCK_TTL_SECONDS = 90; // 1.5 min – released on crash

export async function createPostEmbeddingJob(postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    console.log(post ? "Post found in the worker" : "Post not found in the worker");
}

/**
 * Generates captions for a post's image attachments that are not yet captioned.
 * Only processes supported image types (PNG, JPEG, WEBP, HEIC, HEIF) and updates
 * the StorageObject caption in the database. Uses Redis to prevent duplicate
 * processing when the same image is captioned concurrently.
 */
export async function generatePostCaptionsJob(
    postId: string,
    redis: Redis
): Promise<void> {
    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
            attachments: {
                include: { storageObject: true },
            },
        },
    });

    if (!post) {
        console.warn(`[generatePostCaptionsJob] Post not found: ${postId}`);
        return;
    }

    const uncaptionedImages = post.attachments
        .map((a) => a.storageObject)
        .filter(
            (so) =>
                so.url &&
                SUPPORTED_MIME_SET.has(so.mimeType) &&
                (so.caption == null || so.caption.trim() === "")
        );

    for (const storageObject of uncaptionedImages) {
        const lockKey = `${CAPTIONING_KEY_PREFIX}${storageObject.id}`;

        const acquired = await redis.set(
            lockKey,
            "1",
            "EX",
            CAPTIONING_LOCK_TTL_SECONDS,
            "NX"
        );
        if (acquired !== "OK") {
            continue;
        }

        let captionCompleted = false;

        try {
            const url = storageObject.url!;
            const mimeType = storageObject.mimeType as SupportedImageMimeType;

            const base64ImageData = await imageUrlToBase64(url);
            if (!base64ImageData) {
                console.warn(
                    `[generatePostCaptionsJob] Failed to fetch image for storage object ${storageObject.id}`
                );
                continue;
            }

            const caption = await googleGenAIService.createImageCaption(
                base64ImageData,
                mimeType
            );
            if (!caption) {
                console.warn(
                    `[generatePostCaptionsJob] Failed to generate caption for storage object ${storageObject.id}`
                );
                continue;
            }

            const truncatedCaption =
                caption.length > CAPTION_MAX_LENGTH
                    ? caption.slice(0, CAPTION_MAX_LENGTH)
                    : caption;

            await prisma.storageObject.update({
                where: { id: storageObject.id, caption: null },
                data: { caption: truncatedCaption },
            });
            captionCompleted = true;
        } finally {
            if (captionCompleted) {
                await redis.del(lockKey);
            }
        }
    }
}
