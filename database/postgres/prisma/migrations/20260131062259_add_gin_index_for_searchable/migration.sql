-- CreateIndex
CREATE INDEX "Post_searchable_idx" ON "Post" USING GIN ("searchable");
