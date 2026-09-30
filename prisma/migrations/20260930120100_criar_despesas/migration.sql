-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "family_account_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "due_date" DATE NOT NULL,
    "entry_date" DATE NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_payments" (
    "id" UUID NOT NULL,
    "expense_id" UUID NOT NULL,
    "reference_month" DATE NOT NULL,
    "paid_by" UUID NOT NULL,
    "paid_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "family_account_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_tags" (
    "expense_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "expense_tags_pkey" PRIMARY KEY ("expense_id","tag_id")
);

-- CreateIndex
CREATE INDEX "expenses_family_account_id_due_date_idx" ON "expenses"("family_account_id", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_family_account_id_normalized_name_key" ON "expenses"("family_account_id", "normalized_name");

-- CreateIndex
CREATE UNIQUE INDEX "expense_payments_expense_id_reference_month_key" ON "expense_payments"("expense_id", "reference_month");

-- CreateIndex
CREATE UNIQUE INDEX "tags_family_account_id_normalized_name_key" ON "tags"("family_account_id", "normalized_name");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_family_account_id_fkey" FOREIGN KEY ("family_account_id") REFERENCES "family_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_payments" ADD CONSTRAINT "expense_payments_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_payments" ADD CONSTRAINT "expense_payments_paid_by_fkey" FOREIGN KEY ("paid_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_family_account_id_fkey" FOREIGN KEY ("family_account_id") REFERENCES "family_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_tags" ADD CONSTRAINT "expense_tags_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_tags" ADD CONSTRAINT "expense_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

