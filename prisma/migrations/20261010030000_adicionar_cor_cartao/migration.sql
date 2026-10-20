-- AlterTable (apenas se a coluna não existir)
ALTER TABLE "credit_cards" ADD COLUMN IF NOT EXISTS "color" CHAR(7);

-- AddConstraint (apenas se a coluna existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.constraint_column_usage 
             WHERE table_name='credit_cards' AND constraint_name='credit_cards_color_check') THEN
    NULL; -- constraint já existe
  ELSE
    ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_color_check"
      CHECK ("color" IS NULL OR "color" ~ '^#[0-9a-fA-F]{6}$');
  END IF;
END $$;
