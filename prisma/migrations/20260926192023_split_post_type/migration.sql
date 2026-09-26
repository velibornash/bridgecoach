-- AlterTable
ALTER TABLE "CommunityPost" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'milestone';

-- CreateIndex
CREATE INDEX "CommunityPost_type_idx" ON "CommunityPost"("type");
