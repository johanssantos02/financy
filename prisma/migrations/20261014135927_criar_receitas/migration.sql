-- CreateEnum
CREATE TYPE "income_types" AS ENUM ('salary', 'other');

-- CreateTable
CREATE TABLE "incomes" (
    "id" UUID NOT NULL,
    "family_account_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "income_types" NOT NULL,
    "description" TEXT,
    "reference_month" DATE,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "incomes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "incomes_family_account_id_created_at_idx" ON "incomes"("family_account_id", "created_at");

-- AddForeignKey
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_family_account_id_fkey" FOREIGN KEY ("family_account_id") REFERENCES "family_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddConstraint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_amount_check" CHECK (amount > 0);
