-- Enable pgvector extension for 3072-dimensional embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable: Add optional embedding column (1536 dimensions) to Post
ALTER TABLE "Post" ADD COLUMN "embedding" vector(1536);

-- Create HNSW index for approximate nearest neighbor search on embedding (cosine distance).
-- m = 16 (connections per layer); ef_construction = 64 (build-time search size). Tune ef_search at query time for recall/speed.
CREATE INDEX "Post_embedding_idx" ON "Post" USING hnsw ("embedding" vector_cosine_ops) WITH (m = 16, ef_construction = 64);
