-- CreateEnum
CREATE TYPE "payment_methods" AS ENUM ('cash', 'card');

-- AlterTable: adicionar limite_usado ao cartão de crédito
ALTER TABLE "credit_cards" ADD COLUMN "used_limit" DECIMAL(12,2) NOT NULL DEFAULT 0;

ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_used_limit_check" CHECK ("used_limit" >= 0);

-- CreateTable
CREATE TABLE "spendings" (
    "id" UUID NOT NULL,
    "family_account_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_method" "payment_methods" NOT NULL,
    "date" DATE NOT NULL,
    "credit_card_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "spendings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "spendings_amount_check" CHECK ("amount" > 0)
);

-- CreateIndex
CREATE INDEX "spendings_family_account_id_date_idx" ON "spendings"("family_account_id", "date");

-- AddForeignKey
ALTER TABLE "spendings" ADD CONSTRAINT "spendings_family_account_id_fkey" FOREIGN KEY ("family_account_id") REFERENCES "family_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spendings" ADD CONSTRAINT "spendings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spendings" ADD CONSTRAINT "spendings_credit_card_id_fkey" FOREIGN KEY ("credit_card_id") REFERENCES "credit_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
