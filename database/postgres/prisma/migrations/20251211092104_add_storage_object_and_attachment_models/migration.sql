-- CreateEnum
CREATE TYPE "AttachedWith" AS ENUM ('message', 'post');

-- CreateEnum
CREATE TYPE "StorageObjectStatus" AS ENUM ('pending', 'done');

-- CreateTable
CREATE TABLE "StorageObject" (
    "id" TEXT NOT NULL,
    "mimeType" VARCHAR(255) NOT NULL,
    "size" INTEGER NOT NULL,
    "filename" VARCHAR(500) NOT NULL,
    "url" TEXT,
    "storageKey" VARCHAR(500) NOT NULL,
    "hash" VARCHAR(64) NOT NULL,
    "status" "StorageObjectStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "storageObjectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attachedWith" "AttachedWith" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StorageObject_hash_key" ON "StorageObject"("hash");

-- CreateIndex
CREATE INDEX "StorageObject_hash_idx" ON "StorageObject"("hash");

-- CreateIndex
CREATE INDEX "StorageObject_status_idx" ON "StorageObject"("status");

-- CreateIndex
CREATE INDEX "Attachment_userId_idx" ON "Attachment"("userId");

-- CreateIndex
CREATE INDEX "Attachment_storageObjectId_idx" ON "Attachment"("storageObjectId");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_storageObjectId_fkey" FOREIGN KEY ("storageObjectId") REFERENCES "StorageObject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
