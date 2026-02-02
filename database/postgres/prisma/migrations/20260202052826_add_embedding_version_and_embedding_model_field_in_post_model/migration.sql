-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "embeddingModel" VARCHAR(255),
ADD COLUMN     "embeddingVersion" INTEGER NOT NULL DEFAULT 1;
