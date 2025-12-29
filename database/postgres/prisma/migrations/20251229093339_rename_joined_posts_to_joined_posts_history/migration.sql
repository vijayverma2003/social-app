/*
  Warnings:

  - You are about to drop the `JoinedPosts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "JoinedPosts" DROP CONSTRAINT "JoinedPosts_postId_fkey";

-- DropForeignKey
ALTER TABLE "JoinedPosts" DROP CONSTRAINT "JoinedPosts_userId_fkey";

-- DropTable
DROP TABLE "JoinedPosts";

-- CreateTable
CREATE TABLE "JoinedPostsHistory" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JoinedPostsHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JoinedPostsHistory_postId_idx" ON "JoinedPostsHistory"("postId");

-- CreateIndex
CREATE INDEX "JoinedPostsHistory_userId_idx" ON "JoinedPostsHistory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "JoinedPostsHistory_postId_userId_key" ON "JoinedPostsHistory"("postId", "userId");

-- AddForeignKey
ALTER TABLE "JoinedPostsHistory" ADD CONSTRAINT "JoinedPostsHistory_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoinedPostsHistory" ADD CONSTRAINT "JoinedPostsHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
