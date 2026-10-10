# Data Model: Cadastro de cartões de crédito

**Feature**: `004-cadastro-cartoes-credito` | **Date**: 2026-10-10

## CartaoCredito (novo) — tabela `credit_cards`

| Campo (Prisma)    | Coluna              | Tipo                  | Regras |
|-------------------|---------------------|-----------------------|--------|
| `id`              | `id`                | `Uuid`, PK, `uuid()`  | gerado no servidor |
| `contaFamiliaId`  | `family_account_id` | `Uuid`, FK obrigatória| vem da sessão; `onDelete: Restrict` |
| `nome`            | `name`              | `String`              | trim, 1–60 caracteres |
| `nomeNormalizado` | `normalized_name`   | `String`              | `normalizarNome(nome)`; único por família |
| `instituicao`     | `issuer`            | `String`              | trim, 1–60 caracteres |
| `limite`          | `credit_limit`      | `Decimal(12, 2)`      | > 0; até 10 dígitos inteiros e 2 decimais; CHECK no banco |
| `diaFechamento`   | `closing_day`       | `Int @db.SmallInt`    | inteiro 1–31; CHECK no banco |
| `diaVencimento`   | `due_day`           | `Int @db.SmallInt`    | inteiro 1–31; CHECK no banco |
| `criadoEm`        | `created_at`        | `Timestamptz(3)`      | `now()` |
| `atualizadoEm`    | `updated_at`        | `Timestamptz(3)`      | `@updatedAt` |

**Índices/constraints**

- `@@unique([contaFamiliaId, nomeNormalizado])` — unicidade do nome (FR-010) e índice para a listagem
  por família.
- FK `family_account_id → family_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE` (FR-027).
- `credit_cards_credit_limit_check`, `credit_cards_closing_day_check`, `credit_cards_due_day_check`
  (SQL manual na migration).

**Não armazenado (FR-012)**: número do cartão (total ou parcial), CVV, validade, titular, senha,
bandeira ou qualquer credencial. **Limite usado** também não é armazenado (FR-015).

### Alteração em `ContaFamilia`

Apenas o campo de relação `cartoes CartaoCredito[]` (sem efeito em SQL). Nenhuma outra entidade muda.

### Migration

`prisma/migrations/<timestamp>_criar_cartoes_credito/migration.sql`, gerada com
`prisma migrate dev --create-only --name criar_cartoes_credito`, revisada para conter somente
`CREATE TABLE "credit_cards"`, o índice único, a FK e os três CHECKs. Aditiva: não toca dados existentes.

## Tipos de domínio (`entities/cartao`)

- **`EntradaCartao`** (inferido de `schemaCartao`): `{ nome, instituicao, limite: string /* "1234.56" */,
  diaFechamento: number, diaVencimento: number }`. Campos desconhecidos são descartados pelo `z.object`.
- **`EntradaEditarCartao`** (`schemaEditarCartao`): `EntradaCartao & { id: uuid }` — edição envia o
  formulário completo.
- **`ResumoCartao`** (listagem): `{ id, nome, instituicao, limite: string, limiteUsado: string, diaFechamento,
  diaVencimento }` — decimais serializados com `toFixed(2)`; `limiteUsado` é `"0.00"` nesta entrega.
- **`DetalheCartao`** (formulário de edição): `{ id, nome, instituicao, limite, diaFechamento,
  diaVencimento }`.

## Validação (mesmo schema no cliente e no servidor)

| Campo | Regra | Mensagem |
|-------|-------|----------|
| `nome` | obrigatório, trim, ≤ 60 | "Informe o nome do cartão." / "O nome deve ter no máximo 60 caracteres." |
| `instituicao` | obrigatório, trim, ≤ 60 | "Informe a instituição financeira." / "... no máximo 60 caracteres." |
| `limite` | `^\d{1,10}([.,]\d{1,2})?$` e > 0 | "Informe o limite." / "Informe um limite válido." / "O limite deve ser maior que zero." |
| `diaFechamento` | inteiro 1–31 (string numérica coerced) | "Informe um dia de fechamento entre 1 e 31." |
| `diaVencimento` | inteiro 1–31 | "Informe um dia de vencimento entre 1 e 31." |
| `id` (editar/excluir) | uuid | "Cartão inválido." |

## Ciclo de vida

Sem estados: **criado → (editado)* → excluído** (remoção física). Exclusão restrita a administradores.
Nenhuma outra tabela referencia cartões nesta entrega.
