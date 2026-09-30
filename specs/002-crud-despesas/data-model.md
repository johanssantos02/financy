# Data Model: CRUD de Despesas

**Feature**: `002-crud-despesas` | **Date**: 2026-09-30

Convenções do schema existente mantidas: modelos em português, tabelas/colunas em inglês
snake_case via `@@map`/`@map`, IDs `uuid`, timestamps `Timestamptz(3)`.

## Entidades persistidas

### Despesa → `expenses`

| Campo | Tipo | Regras |
| --- | --- | --- |
| `id` | `String @id @default(uuid()) @db.Uuid` | PK |
| `contaFamiliaId` | `String @db.Uuid` → `ContaFamilia` | obrigatório, vindo da sessão |
| `nome` | `String` | obrigatório, 1–80 caracteres após `trim` |
| `nomeNormalizado` | `String?` `@map("normalized_name")` | `lower(trim(nome))`; `NULL` após exclusão |
| `valor` | `Decimal @db.Decimal(12, 2)` | obrigatório, `> 0`, máx. 2 casas |
| `vencimento` | `DateTime @db.Date` `@map("due_date")` | obrigatório |
| `lancamento` | `DateTime @db.Date` `@map("entry_date")` | padrão: hoje (America/Sao_Paulo) |
| `recorrente` | `Boolean @default(false)` `@map("recurring")` | |
| `descricao` | `String?` `@map("description")` | máx. 500 caracteres |
| `criadoPorId` | `String @db.Uuid` → `User` `@map("created_by")` | |
| `criadoEm` / `atualizadoEm` | `Timestamptz(3)` | padrão do projeto |
| `excluidoEm` | `DateTime? @db.Timestamptz(3)` `@map("deleted_at")` | exclusão lógica |

Índices: `@@unique([contaFamiliaId, nomeNormalizado])`, `@@index([contaFamiliaId, vencimento])`.

### PagamentoDespesa → `expense_payments`

| Campo | Tipo | Regras |
| --- | --- | --- |
| `id` | `String @id @default(uuid()) @db.Uuid` | PK |
| `despesaId` | → `Despesa` (`onDelete: Cascade`) | |
| `competencia` | `DateTime @db.Date` `@map("reference_month")` | sempre dia 1 do mês |
| `pagoPorId` | → `User` `@map("paid_by")` | usuário da sessão |
| `pagoEm` | `DateTime @default(now()) @db.Timestamptz(3)` `@map("paid_at")` | |

Índice: `@@unique([despesaId, competencia])` — garante FR-006 mesmo sob concorrência.
Desmarcar = remover o registro (auditoria de quem desmarcou fica fora do escopo).

### Tag → `tags`

| Campo | Tipo | Regras |
| --- | --- | --- |
| `id` | `String @id @default(uuid()) @db.Uuid` | PK |
| `contaFamiliaId` | → `ContaFamilia` | |
| `nome` | `String` | 1–30 caracteres após `trim` |
| `nomeNormalizado` | `String` | `@@unique([contaFamiliaId, nomeNormalizado])` |
| `criadoEm` | `Timestamptz(3)` | |

### DespesaTag → `expense_tags`

`despesaId` + `tagId`, `@@id([despesaId, tagId])`, ambos `onDelete: Cascade`.
Na criação/edição, tags são recebidas como lista de nomes (máx. 10) e feitas `upsert` pelo
`nomeNormalizado` dentro da mesma transação.

### Relações adicionadas a modelos existentes

- `ContaFamilia`: `despesas Despesa[]`, `tags Tag[]`
- `User`: `despesasCriadas Despesa[]`, `pagamentosDespesa PagamentoDespesa[]`

## Tipos de domínio (não persistidos)

```ts
type SituacaoDespesa = "ABERTA" | "VENCIMENTO_PROXIMO" | "VENCIDA" | "PAGA";
type GrupoSituacao = "VENCIDAS" | "ABERTAS" | "PAGAS";

type OcorrenciaDespesa = {
  despesaId: string;
  nome: string;
  valor: string;            // decimal serializado, formatado só na UI
  competencia: string;      // "AAAA-MM"
  vencimento: string;       // "AAAA-MM-DD" já ajustado ao mês
  recorrente: boolean;
  descricao: string | null;
  tags: string[];
  situacao: SituacaoDespesa;
  pagamento: { pagoEm: string; pagoPor: string } | null;
};
```

## Regras e transições

```text
            marcarComoPaga (competência sem pagamento)
 ABERTA ─┐ ───────────────────────────────────────────► PAGA
 VENC_PROX ─┤                                            │
 VENCIDA ─┘ ◄────────────────────────────────────────────┘
            desmarcarPagamento (qualquer membro)
```

- Situação sem pagamento é derivada: `vencimento < hoje` → VENCIDA; `≤ hoje + 5` → VENCIMENTO_PROXIMO;
  senão ABERTA.
- Marcar exige competência válida para a despesa (recorrente: `≥ mês do vencimento` e anterior à
  exclusão; não recorrente: igual ao mês do vencimento). Caso contrário: `VALIDACAO`.
- Marcar já paga → `CONFLITO`; desmarcar não paga → `CONFLITO`.
- Excluir: somente `ADMIN`; define `excluidoEm = now()` e `nomeNormalizado = NULL`.
- Ordenação: grupo (VENCIDAS, ABERTAS, PAGAS) e, dentro do grupo, `vencimento` crescente e `nome`.

## Migration

Nova migration `prisma/migrations/<timestamp>_criar_despesas/` gerada com
`npx prisma migrate dev --create-only --name criar_despesas`, revisada e versionada. Nenhum dado
existente é alterado.
