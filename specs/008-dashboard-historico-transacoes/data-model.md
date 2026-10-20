# Data Model: Dashboard — Histórico de Transações

**Feature**: `008-dashboard-historico-transacoes` | **Date**: 2026-10-18

---

## Nenhuma migration Prisma necessária

Todas as entidades já existem no schema. Esta feature introduz apenas um **conceito de query** — `TransacaoUnificada` — que não é persistido.

---

## Entidades existentes utilizadas

### Gasto (`spendings`)

| Campo Prisma | Coluna DB | Tipo | Uso nesta feature |
|---|---|---|---|
| `id` | `id` | `UUID` | identificador da transação |
| `nome` | `name` | `String` | exibição + filtro ILIKE |
| `valor` | `amount` | `Decimal(12,2)` | exibição |
| `formaPagamento` | `payment_method` | `FormaPagamento` | determina tipo: `CASH` → `GASTO_DINHEIRO`, `CARD` → `GASTO_CARTAO` |
| `data` | `date` | `Date` | exibição |
| `criadoEm` | `created_at` | `Timestamptz` | ordenação global |
| `contaFamiliaId` | `family_account_id` | `UUID` | filtro de segurança |

### PagamentoDespesa (`expense_payments`)

| Campo Prisma | Coluna DB | Tipo | Uso nesta feature |
|---|---|---|---|
| `id` | `id` | `UUID` | identificador da transação |
| `pagoEm` | `paid_at` | `Timestamptz` | **NÃO usado para ordenação** — `criadoEm` via `created_at` |
| `criadoEm` | — | **Não existe no schema atual** | ver nota abaixo |

> **Nota sobre ordenação de PagamentoDespesa**: O modelo `PagamentoDespesa` **não possui** campo `criadoEm`/`created_at` no schema Prisma atual. A coluna `paid_at` (`pagoEm`) representa quando o pagamento foi registrado e funciona como proxy para `created_at` nesta feature. A ordenação global usará `paid_at` para `DESPESA_PAGA`.

| Campo Prisma | Coluna DB | Tipo | Uso nesta feature |
|---|---|---|---|
| `pagoEm` | `paid_at` | `Timestamptz` | ordenação global (proxy de created_at) |
| `despesaId` | `expense_id` | `UUID` | JOIN com expenses |

### Despesa (`expenses`) — via JOIN com PagamentoDespesa

| Campo Prisma | Coluna DB | Tipo | Uso nesta feature |
|---|---|---|---|
| `nome` | `name` | `String` | exibição + filtro ILIKE |
| `valor` | `amount` | `Decimal(12,2)` | exibição |
| `contaFamiliaId` | `family_account_id` | `UUID` | filtro de segurança |
| `excluidoEm` | `deleted_at` | `Timestamptz?` | filtro `IS NULL` |

### Receita (`incomes`) — usada indiretamente pelo saldo

Não aparece na lista de transações. Usada apenas por `obterSaldoMes`.

---

## Conceito de query: `TransacaoUnificada`

Tipo TypeScript retornado pela query UNION ALL. **Não é uma tabela**.

```typescript
// src/entities/gasto/model/tipos.ts

export type TipoTransacao = "GASTO_DINHEIRO" | "GASTO_CARTAO" | "DESPESA_PAGA";

export type TransacaoUnificada = {
  id: string;
  nome: string;
  valor: string;        // Decimal serializado como string ("123.45")
  tipo: TipoTransacao;
  criadoEm: string;    // ISO 8601 string
  editavel: boolean;   // true somente para GASTO_DINHEIRO
};
```

### Regras de construção

| Fonte | tipo | editavel | valor | nome |
|---|---|---|---|---|
| `Gasto` com `formaPagamento = DINHEIRO` | `GASTO_DINHEIRO` | `true` | `gasto.valor` | `gasto.nome` |
| `Gasto` com `formaPagamento = CARTAO` | `GASTO_CARTAO` | `false` | `gasto.valor` | `gasto.nome` |
| `PagamentoDespesa` | `DESPESA_PAGA` | `false` | `despesa.valor` | `despesa.nome` |

---

## Parâmetros de consulta: `FiltrosHistorico`

```typescript
// src/entities/gasto/model/tipos.ts

export type FiltrosHistorico = {
  busca: string;    // termo de busca; "" = sem filtro
  pagina: number;   // 1-indexed; mínimo 1
  limite: number;   // itens por página; padrão 20
};
```

### Schema Zod para validação de searchParams

```typescript
// src/entities/gasto/model/schemas.ts

export const schemaFiltrosHistorico = z.object({
  busca: z.string().default(""),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
});
```

---

## SQL UNION ALL — Query principal

```sql
-- Parâmetros: $1 = contaFamiliaId (UUID), $2 = '%busca%' (ILIKE), $3 = limite, $4 = offset

(
  SELECT
    g.id::text,
    g.name AS nome,
    g.amount::text AS valor,
    CASE WHEN g.payment_method = 'cash' THEN 'GASTO_DINHEIRO' ELSE 'GASTO_CARTAO' END AS tipo,
    g.created_at,
    (g.payment_method = 'cash') AS editavel
  FROM spendings g
  WHERE g.family_account_id = $1::uuid
    AND g.name ILIKE $2
)
UNION ALL
(
  SELECT
    pd.id::text,
    d.name AS nome,
    d.amount::text AS valor,
    'DESPESA_PAGA' AS tipo,
    pd.paid_at AS created_at,
    FALSE AS editavel
  FROM expense_payments pd
  JOIN expenses d ON d.id = pd.expense_id
  WHERE d.family_account_id = $1::uuid
    AND d.name ILIKE $2
    AND d.deleted_at IS NULL
)
ORDER BY created_at DESC
LIMIT $3 OFFSET $4
```

---

## SQL — Contagem total (para paginação)

```sql
-- Duas queries em Promise.all, somadas na aplicação

-- Query A: gastos
SELECT COUNT(*)::int AS total
FROM spendings
WHERE family_account_id = $1::uuid AND name ILIKE $2

-- Query B: pagamentos de despesa
SELECT COUNT(*)::int AS total
FROM expense_payments pd
JOIN expenses d ON d.id = pd.expense_id
WHERE d.family_account_id = $1::uuid
  AND d.name ILIKE $2
  AND d.deleted_at IS NULL
```

---

## Invariantes de negócio

- **IV-001**: `contaFamiliaId` sempre provém do servidor (sessão Auth.js) — nunca do cliente.
- **IV-002**: Somente `GASTO_DINHEIRO` tem `editavel = true`; os demais tipos são imutáveis nesta tela.
- **IV-003**: Exclusão de gasto dinheiro: `clientePrisma.gasto.delete({ where: { id, contaFamiliaId } })` — filtro duplo previne deleção cross-tenant.
- **IV-004**: Valores monetários: `Decimal` no banco, serializado como `string` no tipo `TransacaoUnificada` (evita perda de precisão em float JavaScript).
- **IV-005**: `PagamentoDespesa` não tem campo `valor` próprio — o valor exibido é sempre de `Despesa.valor`.
- **IV-006**: Busca insensível a maiúsculas: operador `ILIKE` no PostgreSQL (nativo, sem necessidade de normalização prévia).
- **IV-007**: Paginação sobre conjunto filtrado — o `COUNT` usa os mesmos filtros da query principal.
