/*
  Warnings:

  - A unique constraint covering the columns `[postId,userId]` on the table `JoinedPosts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "JoinedPosts_postId_idx" ON "JoinedPosts"("postId");

-- CreateIndex
CREATE INDEX "JoinedPosts_userId_idx" ON "JoinedPosts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "JoinedPosts_postId_userId_key" ON "JoinedPosts"("postId", "userId");
