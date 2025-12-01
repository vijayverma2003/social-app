-- AlterTable
ALTER TABLE "Friend" ADD COLUMN     "dmChannelId" TEXT;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_dmChannelId_fkey" FOREIGN KEY ("dmChannelId") REFERENCES "DMChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
