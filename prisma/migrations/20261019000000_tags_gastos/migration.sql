-- CreateEnum
CREATE TYPE "tag_types" AS ENUM ('spending', 'expense');

-- AlterTable
ALTER TABLE "tags" ADD COLUMN "type" "tag_types" NOT NULL DEFAULT 'expense';

-- AlterTable
ALTER TABLE "spendings" ADD COLUMN "tag_id" UUID;

-- Drop old unique constraint on tags
ALTER TABLE "tags" DROP CONSTRAINT IF EXISTS "tags_family_account_id_normalized_name_key";

-- Create new unique constraint with type
CREATE UNIQUE INDEX "tags_family_account_id_normalized_name_type_key" 
  ON "tags"("family_account_id", "normalized_name", "type");

-- AddForeignKey
ALTER TABLE "spendings" ADD CONSTRAINT "spendings_tag_id_fkey" 
  FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE SET NULL ON UPDATE CASCADE;
