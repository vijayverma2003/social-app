import prisma from "@database/postgres";

export async function createPostEmbeddingJob(postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    console.log(post ? "Post found in the worker" : "Post not found in the worker");
}
