/*
  Warnings:

  - The primary key for the `DMChannel` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "DMChannel" DROP CONSTRAINT "DMChannel_new_pkey";
