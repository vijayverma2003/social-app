/*
  Warnings:

  - You are about to drop the `PostView` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PostView" DROP CONSTRAINT "PostView_postId_fkey";

-- DropForeignKey
ALTER TABLE "PostView" DROP CONSTRAINT "PostView_userId_fkey";

-- DropTable
DROP TABLE "PostView";

-- CreateTable
CREATE TABLE "JoinedPosts" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JoinedPosts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JoinedPosts" ADD CONSTRAINT "JoinedPosts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoinedPosts" ADD CONSTRAINT "JoinedPosts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
