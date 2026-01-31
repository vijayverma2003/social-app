-- AlterTable: Add ts_language_code for full-text search language config (used in to_tsvector).
ALTER TABLE "Post" ADD COLUMN "ts_language_code" VARCHAR(20) NOT NULL DEFAULT 'english';

-- Add generated tsvector column for full-text search. Use english::regconfig when ts_language_code is 'english', else simple.
ALTER TABLE "Post" ADD COLUMN "searchable" tsvector GENERATED ALWAYS AS (
  CASE
    WHEN "ts_language_code" = 'english' THEN to_tsvector('english'::regconfig, coalesce("content", ''))
    ELSE to_tsvector('simple'::regconfig, coalesce("content", ''))
  END
) STORED;

-- Create GIN index on searchable for fast full-text search.
CREATE INDEX "Post_searchable_idx" ON "Post" USING GIN ("searchable");
