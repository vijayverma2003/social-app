-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "channelId" TEXT;

-- CreateIndex
CREATE INDEX "Post_channelId_idx" ON "Post"("channelId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
