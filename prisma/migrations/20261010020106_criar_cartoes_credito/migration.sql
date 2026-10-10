-- CreateTable
CREATE TABLE "credit_cards" (
    "id" UUID NOT NULL,
    "family_account_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "credit_limit" DECIMAL(12,2) NOT NULL,
    "closing_day" SMALLINT NOT NULL,
    "due_day" SMALLINT NOT NULL,
    "color" CHAR(7),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "credit_cards_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "credit_cards_credit_limit_check" CHECK ("credit_limit" > 0),
    CONSTRAINT "credit_cards_closing_day_check" CHECK ("closing_day" BETWEEN 1 AND 31),
    CONSTRAINT "credit_cards_due_day_check" CHECK ("due_day" BETWEEN 1 AND 31),
    CONSTRAINT "credit_cards_color_check" CHECK ("color" IS NULL OR "color" ~ '^#[0-9a-fA-F]{6}$')
);

-- CreateIndex
CREATE UNIQUE INDEX "credit_cards_family_account_id_normalized_name_key" ON "credit_cards"("family_account_id", "normalized_name");

-- AddForeignKey
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_family_account_id_fkey" FOREIGN KEY ("family_account_id") REFERENCES "family_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
