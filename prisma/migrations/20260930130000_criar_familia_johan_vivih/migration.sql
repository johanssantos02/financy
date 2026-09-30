DO $$
DECLARE
    johan_id UUID;
    vivih_id UUID;
    familia_id UUID;
BEGIN
    SELECT "id" INTO johan_id FROM "users" WHERE "email" = 'johancardoso1911@gmail.com';
    SELECT "id" INTO vivih_id FROM "users" WHERE "email" = 'cardosovivihsantos@gmail.com';

    IF johan_id IS NULL THEN
        RAISE EXCEPTION 'Usuário johancardoso1911@gmail.com não encontrado';
    END IF;

    IF vivih_id IS NULL THEN
        RAISE EXCEPTION 'Usuário cardosovivihsantos@gmail.com não encontrado';
    END IF;

    UPDATE "users"
    SET "password_hash" = '$2b$10$ROpEVKyRUelGwr4p4IvsyOHNgYAbmVxPw8yGL5ImghStY.qBTY6kS',
        "role" = 'user',
        "updated_at" = CURRENT_TIMESTAMP
    WHERE "id" = vivih_id;

    UPDATE "users"
    SET "role" = 'admin',
        "updated_at" = CURRENT_TIMESTAMP
    WHERE "id" = johan_id;

    -- Reaproveita a primeira família do Johan, se já existir
    SELECT "family_account_id" INTO familia_id
    FROM "user_family_accounts"
    WHERE "user_id" = johan_id
    ORDER BY "joined_at"
    LIMIT 1;

    IF familia_id IS NULL THEN
        familia_id := gen_random_uuid();

        INSERT INTO "family_accounts" ("id", "nome", "updated_at")
        VALUES (familia_id, 'Família Cardoso', CURRENT_TIMESTAMP);
    END IF;

    INSERT INTO "user_family_accounts" ("user_id", "family_account_id", "role")
    VALUES
        (johan_id, familia_id, 'owner'),
        (vivih_id, familia_id, 'member')
    ON CONFLICT ("user_id", "family_account_id") DO UPDATE SET "role" = EXCLUDED."role";
END $$;
