-- AlterTable
ALTER TABLE "credit_cards" ADD COLUMN "color" CHAR(7);

-- AddConstraint
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_color_check"
  CHECK ("color" IS NULL OR "color" ~ '^#[0-9a-fA-F]{6}$');
