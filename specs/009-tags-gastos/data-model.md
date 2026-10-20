# Data Model: Tags em Gastos

**Feature**: 009-tags-gastos | **Data**: 2026-10-19

## Entidades Afetadas

### 1. Enum `TipoTag` (novo)

```prisma
enum TipoTag {
  GASTOS   @map("spending")
  DESPESAS @map("expense")

  @@map("tag_types")
}
```

SQL equivalente:
```sql
CREATE TYPE "tag_types" AS ENUM ('spending', 'expense');
```

---

### 2. Modelo `Tag` (alterado)

**Campo adicionado**: `tipo TipoTag`
**Constraint alterada**: `@@unique` passa a incluir `tipo`
**Relação adicionada**: `gastos Gasto[]`

```prisma
model Tag {
  id              String       @id @default(uuid()) @db.Uuid
  contaFamilia    ContaFamilia @relation(fields: [contaFamiliaId], references: [id])
  contaFamiliaId  String       @map("family_account_id") @db.Uuid
  nome            String       @map("name")
  nomeNormalizado String       @map("normalized_name")
  tipo            TipoTag      @map("type")           // ← NOVO
  despesas        DespesaTag[]
  gastos          Gasto[]                              // ← NOVO
  criadoEm        DateTime     @default(now()) @map("created_at") @db.Timestamptz(3)

  @@unique([contaFamiliaId, nomeNormalizado, tipo])   // ← constraint alterada (adicionou tipo)
  @@map("tags")
}
```

**Regras de validação**:
- `nome`: obrigatório, string não-vazia, normalizado para lowercase sem acento → `nomeNormalizado`
- `tipo`: obrigatório, valor do enum `TipoTag`
- Unicidade por `(contaFamiliaId, nomeNormalizado, tipo)` — dois tipos podem ter o mesmo nome

**Dados iniciais (seed por conta família)**:

| nome             | nomeNormalizado | tipo   |
|------------------|-----------------|--------|
| Lazer            | lazer           | GASTOS |
| Gasolina         | gasolina        | GASTOS |
| Saúde            | saude           | GASTOS |
| Alimentação      | alimentacao     | GASTOS |
| Outros           | outros          | GASTOS |

---

### 3. Modelo `Gasto` (alterado)

**Campo adicionado**: `tagId String? @map("tag_id") @db.Uuid`
**Relação adicionada**: `tag Tag?` com `onDelete: SetNull`

```prisma
model Gasto {
  id             String         @id @default(uuid()) @db.Uuid
  contaFamilia   ContaFamilia   @relation(fields: [contaFamiliaId], references: [id], onDelete: Restrict)
  contaFamiliaId String         @map("family_account_id") @db.Uuid
  criadoPor      User           @relation("GastoCriadoPor", fields: [criadoPorId], references: [id])
  criadoPorId    String         @map("created_by") @db.Uuid
  nome           String         @map("name")
  valor          Decimal        @map("amount") @db.Decimal(12, 2)
  formaPagamento FormaPagamento @map("payment_method")
  data           DateTime       @map("date") @db.Date
  cartao         CartaoCredito? @relation(fields: [cartaoId], references: [id])
  cartaoId       String?        @map("credit_card_id") @db.Uuid
  tag            Tag?           @relation(fields: [tagId], references: [id], onDelete: SetNull) // ← NOVO
  tagId          String?        @map("tag_id") @db.Uuid                                         // ← NOVO
  criadoEm       DateTime       @default(now()) @map("created_at") @db.Timestamptz(3)
  atualizadoEm   DateTime       @updatedAt @map("updated_at") @db.Timestamptz(3)

  @@index([contaFamiliaId, data])
  @@map("spendings")
}
```

**Regras de validação**:
- `tagId`: opcional (nullable); quando presente, deve referenciar uma `Tag` existente **e** de `tipo = GASTOS` **e** da mesma `contaFamiliaId`
- A validação de tipo acontece no servidor (Server Action), não no Zod de fronteira

---

## Diagrama de Relacionamentos (afetados)

```
ContaFamilia ──< Tag (tipo: GASTOS | DESPESAS)
                  │
                  ├──< DespesaTag >── Despesa   (N:M existente, sem alteração)
                  │
                  └──< Gasto.tagId              (1:N novo, nullable, SET NULL)
```

---

## Tipos TypeScript

### `ResumoTag` (novo, em `src/entities/tag/model/tipos.ts`)

```typescript
export type ResumoTag = {
  id: string;
  nome: string;
};
```

### `ResumoGasto` (alterado, em `src/entities/gasto/model/tipos.ts`)

```typescript
export type ResumoGasto = {
  id: string;
  nome: string;
  valor: string;
  formaPagamento: FormaPagamento;
  data: string;
  cartaoId: string | null;
  cartaoNome: string | null;
  tagId: string | null;    // ← novo
  tagNome: string | null;  // ← novo
};
```

### `TransacaoUnificada` (alterado, em `src/entities/gasto/model/tipos.ts`)

```typescript
export type TransacaoUnificada = {
  id: string;
  nome: string;
  valor: string;
  tipo: TipoTransacao;
  criadoEm: string;
  editavel: boolean;
  tagNome: string | null;  // ← novo
};
```

---

## Schemas Zod

### `schemaGasto` (alterado, em `src/entities/gasto/model/schemas.ts`)

```typescript
// adicionar campo:
tagId: z.uuid("Tag inválida.").nullish().transform((v) => v ?? null),
```

O schema não valida o `tipo` da tag (isso é responsabilidade da Server Action).

### `schemaTagId` (server-side, em `src/entities/tag/model/schemas.ts`)

```typescript
// Usado internamente na Server Action para validar que a tag é do tipo GASTOS
export const schemaTagIdGasto = z.uuid("Tag inválida.").nullish();
```

---

## Queries (resumo)

| Função | Arquivo | Descrição |
|---|---|---|
| `listarTagsPorTipo(contaFamiliaId, tipo)` | `entities/tag/api/consultas.ts` | SELECT id, name FROM tags WHERE family_account_id = ? AND type = ? ORDER BY name |
| `listarGastosPorContaEMes` | `entities/gasto/api/consultas.ts` | include `tag: { select: { nome: true } }` |
| `listarTransacoesUnificadas` | `entities/gasto/api/consultas.ts` | LEFT JOIN tags ON tags.id = spendings.tag_id; adicionar `tag_name` ao SELECT |
| `criarGasto` / `editarGasto` | `features/gastos/api/acoes.ts` | verificar tag existe + tipo GASTOS; inserir/atualizar com tagId |

---

## Estrutura da Migration SQL (prévia — NÃO GERADA AINDA)

```sql
-- 1. Criar enum
CREATE TYPE "tag_types" AS ENUM ('spending', 'expense');

-- 2. Adicionar coluna tipo em tags (DEFAULT 'expense' para retrocompatibilidade com tags existentes)
ALTER TABLE "tags" ADD COLUMN "type" "tag_types" NOT NULL DEFAULT 'expense';

-- 3. Remover constraint unique antiga
ALTER TABLE "tags" DROP CONSTRAINT "tags_family_account_id_normalized_name_key";

-- 4. Criar nova constraint unique (incluindo tipo)
CREATE UNIQUE INDEX "tags_family_account_id_normalized_name_type_key"
  ON "tags"("family_account_id", "normalized_name", "type");

-- 5. Adicionar FK tag_id em spendings (nullable, SET NULL on delete)
ALTER TABLE "spendings" ADD COLUMN "tag_id" UUID;
ALTER TABLE "spendings"
  ADD CONSTRAINT "spendings_tag_id_fkey"
  FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- (seed dos 5 valores iniciais fica em prisma/seed.ts, não nesta migration)
```

> **IMPORTANTE**: Aguarda validação do usuário sobre "tags globais vs. por conta família"
> (ver `research.md` — Decisão 5) antes de gerar o arquivo `migration.sql`.
