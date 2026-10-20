# Research: Dashboard — Histórico de Transações

**Feature**: `008-dashboard-historico-transacoes` | **Date**: 2026-10-18

---

## Questões investigadas

### R-001: Como paginar resultados de múltiplas tabelas com ordenação global?

**Decisão**: SQL UNION ALL com `ORDER BY created_at DESC LIMIT $n OFFSET $m`

**Rationale**: O Prisma não suporta `union()` no query builder (versão 7). A única forma de obter paginação + ordenação global correta entre `spendings` e `expense_payments` é uma query raw com UNION ALL. A alternativa de buscar tudo em memória é funcional para < 500 registros, mas produz paginação incorreta pois cada `findMany` retornaria apenas dados da própria tabela.

**Alternativas consideradas**:
- `findMany` separados + merge + slice em memória → Rejeita: paginação incorreta (não reflete ordem global)
- View materializada no Postgres → Rejeita: requer migration e manutenção extra, desnecessária para volume esperado
- Cursor-based pagination → Rejeita: UNION não suporta cursor de forma simples; OFFSET é adequado para < 10.000 registros

**Impacto**: `listarTransacoesUnificadas` e `contarTransacoesUnificadas` usam `$queryRaw`. Tipo de retorno deve ser declarado explicitamente.

---

### R-002: Como implementar drag-to-reveal em mobile sem biblioteca?

**Decisão**: `onPointerDown` / `onPointerMove` / `onPointerUp` com `transform: translateX()` e CSS `transition` desabilitado durante o arraste

**Rationale**: O gesto é simples (translação horizontal unidirecional, threshold fixo de 80px). Não há física de velocidade (spring). Uma biblioteca como `react-swipeable` adicionaria ~6KB para o mesmo resultado. O `Pointer Events API` funciona tanto em touch quanto em mouse, eliminando o tratamento separado de eventos.

**Implementação**:
```
onPointerDown → capturar startX, setPointerCapture
onPointerMove → calcular deltaX, se deltaX < 0 aplicar translateX (clamped a -ACTION_WIDTH)
onPointerUp   → se |deltaX| > THRESHOLD (80px) → fixar no ACTION_WIDTH; senão → reset para 0
```

**Edge cases**:
- Swipe parcial (< 80px): retorna ao estado fechado
- Scroll vertical enquanto arrastra: `onPointerCancel` reseta o estado
- Itens `GASTO_CARTAO` e `DESPESA_PAGA`: não registram handlers de pointer

---

### R-003: Onde vive o estado de busca e paginação?

**Decisão**: URL searchParams (`?busca=termo&pagina=2`)

**Rationale**: Permite bookmarking, deep-link e correto funcionamento do botão Voltar. Não é necessário `useState` no Server Component. O `BarraBuscaHistorico` usa `useRouter().replace()` com debounce de 400ms para não gerar uma entrada de histórico por tecla digitada.

**Implementação**:
- `useSearchParams()` no Client Component para ler o valor atual do campo de busca
- `router.replace(pathname + '?' + params.toString())` ao digitar
- `router.replace(pathname + '?' + params.toString())` ao mudar de página (sem debounce)
- Reset da página para 1 quando o termo de busca muda

---

### R-004: Como obter `nome` e `valor` de um `PagamentoDespesa`?

**Decisão**: JOIN com tabela `expenses` na query UNION

**Rationale**: O modelo `PagamentoDespesa` não possui campos `nome` ou `valor` — apenas referencia a `Despesa` pai. O `nome` e `valor` da transação do tipo `DESPESA_PAGA` devem ser obtidos via `JOIN expenses ON expenses.id = expense_payments.expense_id`.

**Schema confirmado**:
```
PagamentoDespesa: id, despesaId, competencia, pagoPorId, pagoEm (SEM nome/valor)
Despesa: id, nome, valor, contaFamiliaId, deletedAt, ...
```

**Cuidado**: Filtrar `expenses.deleted_at IS NULL` para não incluir despesas excluídas logicamente.

---

### R-005: Saldo — reusar ou criar nova função?

**Decisão**: Reusar `obterSaldoMes` existente em `src/entities/despesa/api/saldo.ts`

**Rationale**: A função já calcula `receitas - despesasPagas - gastos` para um mês de competência. É exatamente o que a spec exige (FR-001). Nenhuma lógica nova necessária. Chamada com `competenciaAtual()` no Server Component da página.

---

### R-006: Como garantir que `contaFamiliaId` nunca vem do cliente?

**Decisão**: Toda consulta de dados passa por `obterContextoUsuario()` (Server Component ou Server Action)

**Rationale**: Constituição IV — `contaFamiliaId` deve ser obtido do servidor. O padrão já estabelecido no projeto: `obterContextoUsuario()` retorna `{ usuarioId, contaFamiliaId, papel }` lendo da sessão Auth.js. As queries de histórico recebem `contaFamiliaId` como parâmetro, nunca como input do cliente.

---

### R-007: Query de contagem para paginação

**Decisão**: Duas queries `COUNT(*)` separadas (uma por tabela) somadas na aplicação, em paralelo com a query principal

**Rationale**: Um `SELECT COUNT(*) FROM (UNION ALL ...)` seria limpo mas requer wrapping do UNION como subquery. Como o custo de duas queries simples de COUNT é mínimo e o Prisma permite paralelo com `Promise.all`, esta abordagem é mais legível.

```sql
-- Em paralelo:
SELECT COUNT(*) FROM spendings WHERE family_account_id = $1 AND name ILIKE $2
SELECT COUNT(*) FROM expense_payments pd
  JOIN expenses d ON d.id = pd.expense_id
  WHERE d.family_account_id = $1 AND d.name ILIKE $2 AND d.deleted_at IS NULL
-- Total = soma dos dois
```

---

### R-008: Rota de edição de gasto

**Decisão**: Criar `app/(app)/gastos/[id]/editar/page.tsx` como stub com formulário básico reutilizando `schemaGasto`

**Rationale**: A spec assume que a tela de edição "já existe ou será construída em outra feature". Sem a rota, a navegação do drag-to-reveal resulta em 404. O stub mínimo recebe `id` via params, busca o gasto (validando `contaFamiliaId` para segurança) e exibe os dados — deixando a UI polida para uma feature futura.

---

## Resumo de decisões

| ID | Questão | Decisão |
|----|---------|---------|
| R-001 | Paginação multi-tabela | `$queryRaw` UNION ALL |
| R-002 | Drag-to-reveal | Pointer Events nativos, threshold 80px |
| R-003 | Estado busca/paginação | URL searchParams |
| R-004 | Nome/valor de PagamentoDespesa | JOIN com expenses |
| R-005 | Saldo | Reusar `obterSaldoMes` |
| R-006 | Segurança contaFamiliaId | `obterContextoUsuario()` no servidor |
| R-007 | Contagem para paginação | 2× `COUNT(*)` em paralelo |
| R-008 | Rota edição gasto | Stub mínimo na rota `/gastos/[id]/editar` |
