/*
  Warnings:

  - Made the column `username` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `discriminator` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `dob` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL,
ALTER COLUMN "discriminator" SET NOT NULL,
ALTER COLUMN "dob" SET NOT NULL;
