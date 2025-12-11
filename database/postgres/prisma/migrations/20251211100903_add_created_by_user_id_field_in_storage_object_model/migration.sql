-- AlterTable
ALTER TABLE "StorageObject" ADD COLUMN     "createdByUserId" TEXT;

-- CreateIndex
CREATE INDEX "StorageObject_createdByUserId_idx" ON "StorageObject"("createdByUserId");
