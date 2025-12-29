/*
  Warnings:

  - You are about to drop the `JoinedPostsHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "JoinedPostsHistory" DROP CONSTRAINT "JoinedPostsHistory_postId_fkey";

-- DropForeignKey
ALTER TABLE "JoinedPostsHistory" DROP CONSTRAINT "JoinedPostsHistory_userId_fkey";

-- DropTable
DROP TABLE "JoinedPostsHistory";

-- CreateTable
CREATE TABLE "RecentPosts" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecentPosts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecentPosts_postId_idx" ON "RecentPosts"("postId");

-- CreateIndex
CREATE INDEX "RecentPosts_userId_idx" ON "RecentPosts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RecentPosts_postId_userId_key" ON "RecentPosts"("postId", "userId");

-- AddForeignKey
ALTER TABLE "RecentPosts" ADD CONSTRAINT "RecentPosts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentPosts" ADD CONSTRAINT "RecentPosts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
