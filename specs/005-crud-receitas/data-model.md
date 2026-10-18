# Data Model: Gerenciamento de Receitas/Entradas

**Feature**: `005-crud-receitas` | **Date**: 2026-10-13

## TipoReceita (enum novo) — `income_types`

| Valor Prisma | Valor DB    |
|--------------|-------------|
| `SALARIO`    | `"salary"`  |
| `OUTRO`      | `"other"`   |

## Receita (novo) — tabela `incomes`

| Campo (Prisma)  | Coluna               | Tipo                         | Regras |
|-----------------|----------------------|------------------------------|--------|
| `id`            | `id`                 | `Uuid`, PK, `uuid()`         | gerado no servidor |
| `contaFamiliaId`| `family_account_id`  | `Uuid`, FK obrigatória       | vem da sessão; `onDelete: Restrict` |
| `criadoPorId`   | `created_by`         | `Uuid`, FK para `users`      | vem da sessão |
| `valor`         | `amount`             | `Decimal(12, 2)`             | > 0; até 10 dígitos inteiros e 2 decimais |
| `tipo`          | `type`               | `TipoReceita` (enum)         | `SALARIO` ou `OUTRO` |
| `descricao`     | `description`        | `String?`                    | trim, ≤ 500 caracteres, `null` se vazio |
| `competencia`   | `reference_month`    | `DateTime? @db.Date`         | `null` para `OUTRO`; `AAAA-MM-01` UTC para `SALARIO` |
| `criadoEm`      | `created_at`         | `Timestamptz(3)`, `now()`    | imutável após criação |
| `atualizadoEm`  | `updated_at`         | `Timestamptz(3)`, `@updatedAt` | gerenciado pelo Prisma |

**Índices/constraints**:
- `@@index([contaFamiliaId, criadoEm])` — consultas filtradas por família, ordenadas por data de criação.
- FK `family_account_id → family_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE`.
- FK `created_by → users(id) ON DELETE RESTRICT ON UPDATE CASCADE`.
- `incomes_amount_check (amount > 0)` — adicionado manualmente na migration.

### Schema Prisma (adição)

```prisma
enum TipoReceita {
  SALARIO @map("salary")
  OUTRO   @map("other")

  @@map("income_types")
}

model Receita {
  id             String       @id @default(uuid()) @db.Uuid
  contaFamilia   ContaFamilia @relation(fields: [contaFamiliaId], references: [id], onDelete: Restrict)
  contaFamiliaId String       @map("family_account_id") @db.Uuid
  criadoPor      User         @relation("ReceitaCriadaPor", fields: [criadoPorId], references: [id])
  criadoPorId    String       @map("created_by") @db.Uuid
  valor          Decimal      @map("amount") @db.Decimal(12, 2)
  tipo           TipoReceita  @map("type")
  descricao      String?      @map("description")
  competencia    DateTime?    @map("reference_month") @db.Date
  criadoEm       DateTime     @default(now()) @map("created_at") @db.Timestamptz(3)
  atualizadoEm   DateTime     @updatedAt @map("updated_at") @db.Timestamptz(3)

  @@index([contaFamiliaId, criadoEm])
  @@map("incomes")
}
```

### Alterações em modelos existentes

`User` — adicionar relação (sem efeito SQL):
```prisma
receitasCriadas Receita[] @relation("ReceitaCriadaPor")
```

`ContaFamilia` — adicionar relação (sem efeito SQL):
```prisma
receitas Receita[]
```

### Migration

Gerar com:
```bash
npx prisma migrate dev --create-only --name criar_receitas
```

Revisar `prisma/migrations/<timestamp>_criar_receitas/migration.sql` para incluir:
1. `CREATE TYPE "income_types" AS ENUM ('salary', 'other');`
2. `CREATE TABLE "incomes" (...)` com todas as colunas
3. `CREATE INDEX "incomes_family_account_id_created_at_idx" ON "incomes"("family_account_id", "created_at");`
4. FKs com `ON DELETE RESTRICT ON UPDATE CASCADE`
5. `ALTER TABLE "incomes" ADD CONSTRAINT "incomes_amount_check" CHECK (amount > 0);` (manual)

Migration é **aditiva** — não toca dados existentes.

## Tipos de domínio (`entities/receita`)

- **`TipoReceita`**: `"SALARIO" | "OUTRO"` — union TypeScript (ou inferida do enum Zod).
- **`EntradaReceita`** (inferida de `schemaReceita`): `{ valor: string /* "1234.56" */, tipo: TipoReceita, descricao: string | null, competencia: string | null }`.
- **`EntradaEditarReceita`** (`schemaEditarReceita`): `EntradaReceita & { id: string /* uuid */ }`.
- **`ResumoReceita`** (listagem): `{ id, valor: string /* "1234.56" */, tipo: TipoReceita, descricao: string | null, competencia: string | null /* "AAAA-MM" */ }`.
- **`DetalheReceita`** (formulário de edição): mesmo que `ResumoReceita`.

## Validação — schemas Zod (`entities/receita/model/schemas.ts`)

| Campo | Regra | Mensagem |
|-------|-------|----------|
| `valor` | obrigatório; `^\d{1,10}([.,]\d{1,2})?$`; > 0 | "Informe o valor." / "Informe um valor válido." / "O valor deve ser maior que zero." |
| `tipo` | `z.enum(["SALARIO", "OUTRO"])` | "Informe o tipo." |
| `descricao` | opcional; trim; ≤ 500; `""` → `null` | "A descrição deve ter no máximo 500 caracteres." |
| `competencia` | `ehCompetenciaValida` (`AAAA-MM`); obrigatória para `SALARIO`; `null` para `OUTRO` | "Informe o mês de recebimento." |
| `id` (editar/excluir) | `z.uuid()` | "Receita inválida." |

`superRefine` valida a regra cross-field (competência × tipo) em ambos os schemas.

## Ciclo de vida

**criado → (editado)* → excluído** (remoção física).

- Exclusão restrita a ADMINs (papel relido do banco, como em `CartaoCredito` e `Despesa`).
- Nenhuma relação dependente nesta entrega — exclusão não bloqueia.
- Sem exclusão lógica: receitas não têm recorrência calculada.
