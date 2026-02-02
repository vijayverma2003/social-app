import prisma from "@database/postgres";
import { geminiAIService, } from "../../services/gemini";
import { normalizeVector, } from "../../utils/utils";

const EMBEDDING_DIMENSIONALITY = 1536;

/**
 * Builds the text content to embed: post content plus any image captions from attachments.
 */
function buildEmbeddingContent(
    postContent: string,
    attachments: { storageObject: { caption: string | null } }[]
): string {
    const parts: string[] = [postContent];

    const captions = attachments
        .map((a) => a.storageObject.caption)
        .filter((c): c is string => c != null && c.trim() !== "");

    if (captions.length > 0) {
        parts.push("Attached images: " + captions.join(" "));
    }

    return parts.join("\n\n");
}

/**
 * Generates an embedding for a post using the Gemini API and stores it on the Post record.
 * If the post has attachments, includes the storage object image captions in the embedded content.
 */
export async function generatePostEmbeddingJob(postId: string): Promise<void> {
    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
            attachments: {
                include: { storageObject: { select: { caption: true } } },
            },
        },
    });

    if (!post) {
        console.warn(`[generatePostEmbeddingJob] Post not found: ${postId}`);
        return;
    }

    if (post.embeddingGeneratedAt !== null) {
        console.warn(`[generatePostEmbeddingJob] Embedding already generated for post ${postId}`);
        return;
    }


    const rawContent = buildEmbeddingContent(post.content, post.attachments).trim();
    if (rawContent.length === 0) {
        console.warn(`[generatePostEmbeddingJob] Empty content for post ${postId}`);
        return;
    }

    const embedding = await geminiAIService.generateVectorEmbedding(rawContent);

    if (!embedding || !embedding.vector || embedding.vector.length !== EMBEDDING_DIMENSIONALITY) {
        console.warn(
            `[generatePostEmbeddingJob] Failed to get embedding for post ${postId} (got ${embedding?.vector.length ?? 0} dimensions)`
        );
        return;
    }


    const vector = `[${embedding.vector.join(',')}]`;
    await prisma.$executeRaw`
    UPDATE "Post" 
    SET "embedding" = ${vector}::vector, 
        "embeddingGeneratedAt" = NOW(), 
        "embeddingModel" = ${embedding.model}, 
        "embeddingVersion" = ${embedding.version}
    WHERE id = ${postId}`;
}

/** Alias for worker registration. */
export const createPostEmbeddingJob = generatePostEmbeddingJob;
