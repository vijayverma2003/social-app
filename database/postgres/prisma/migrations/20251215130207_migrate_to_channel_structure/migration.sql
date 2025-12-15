-- Migration: Migrate DMChannel/DMChannelUser to Channel/ChannelUser structure
-- This migration transforms the existing DM channel structure to a normalized channel structure

-- Step 1: Create Channel table
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "type" "ChannelType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- Step 2: Migrate DMChannel data to Channel + DMChannel
-- Insert into Channel table (using DMChannel.id as Channel.id, type='dm')
INSERT INTO "Channel" ("id", "type", "createdAt")
SELECT "id", 'dm'::"ChannelType", "createdAt"
FROM "DMChannel";

-- Create new DMChannel table structure
CREATE TABLE "DMChannel_new" (
    "channelId" TEXT NOT NULL,

    CONSTRAINT "DMChannel_new_pkey" PRIMARY KEY ("channelId")
);

-- Migrate data to new DMChannel table
INSERT INTO "DMChannel_new" ("channelId")
SELECT "id" FROM "DMChannel";

-- Step 3: Create ChannelUser table
CREATE TABLE "ChannelUser" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3),
    "totalUnreadMessages" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ChannelUser_pkey" PRIMARY KEY ("id")
);

-- Migrate DMChannelUser data to ChannelUser
INSERT INTO "ChannelUser" ("id", "channelId", "userId", "lastReadAt", "totalUnreadMessages")
SELECT "id", "channelId", "userId", "lastReadAt", "totalUnreadMessages"
FROM "DMChannelUser";

-- Step 4: Update Friend table - rename dmChannelId to channelId
ALTER TABLE "Friend" RENAME COLUMN "dmChannelId" TO "channelId";

-- Step 5: Drop old foreign key constraints
ALTER TABLE "DMChannelUser" DROP CONSTRAINT IF EXISTS "DMChannelUser_channelId_fkey";
ALTER TABLE "DMChannelUser" DROP CONSTRAINT IF EXISTS "DMChannelUser_userId_fkey";
ALTER TABLE "Friend" DROP CONSTRAINT IF EXISTS "Friend_dmChannelId_fkey";

-- Step 6: Drop old tables
DROP TABLE "DMChannelUser";
DROP TABLE "DMChannel";

-- Step 7: Rename new DMChannel table
ALTER TABLE "DMChannel_new" RENAME TO "DMChannel";

-- Step 8: Create indexes for ChannelUser
CREATE INDEX "ChannelUser_userId_idx" ON "ChannelUser"("userId");
CREATE UNIQUE INDEX "ChannelUser_channelId_userId_key" ON "ChannelUser"("channelId", "userId");

-- Step 9: Add foreign key constraints
ALTER TABLE "ChannelUser" ADD CONSTRAINT "ChannelUser_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChannelUser" ADD CONSTRAINT "ChannelUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DMChannel" ADD CONSTRAINT "DMChannel_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 10: Add unique constraint to DMChannel
CREATE UNIQUE INDEX "DMChannel_channelId_key" ON "DMChannel"("channelId");

