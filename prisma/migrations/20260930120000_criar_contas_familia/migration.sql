-- CreateEnum
CREATE TYPE "member_roles" AS ENUM ('owner', 'member');

-- CreateTable
CREATE TABLE "family_accounts" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "family_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_family_accounts" (
    "user_id" UUID NOT NULL,
    "family_account_id" UUID NOT NULL,
    "role" "member_roles" NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_family_accounts_pkey" PRIMARY KEY ("user_id","family_account_id")
);

-- AddForeignKey
ALTER TABLE "user_family_accounts" ADD CONSTRAINT "user_family_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_accounts" ADD CONSTRAINT "user_family_accounts_family_account_id_fkey" FOREIGN KEY ("family_account_id") REFERENCES "family_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

