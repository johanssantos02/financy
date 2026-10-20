# Implementation Plan: Dashboard — Histórico de Transações

**Branch**: `008-dashboard-historico-transacoes` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-dashboard-historico-transacoes/spec.md`

---

## Summary

Substituir a página de dashboard placeholder (`app/(app)/dashboard/page.tsx`) por uma tela completa que exibe o saldo do mês atual e um histórico unificado e paginado de transações (gastos em dinheiro, gastos em cartão e despesas pagas), com busca por nome e drag-to-reveal exclusivo em gastos em dinheiro para edição e exclusão.

Abordagem técnica: query SQL UNION ALL via `$queryRaw` do Prisma para unificação e paginação server-side; busca e paginação controladas por URL searchParams (SSR); drag-to-reveal implementado com CSS transform e eventos de touch/pointer nativos (sem biblioteca externa); Server Actions para exclusão e revalidação de cache; FSD estrito com camadas entities → features → widgets → pages → app.

---

## Technical Context

**Language/Version**: TypeScript strict (Next.js 16 App Router · React 19)

**Primary Dependencies**: Prisma ORM 7 · Auth.js v5 · Zod v4 · Tailwind CSS v4 · Lucide React

**Storage**: PostgreSQL (Supabase) — tabelas `spendings` (Gasto), `expense_payments` (PagamentoDespesa), `expenses` (Despesa), `incomes` (Receita), `family_accounts` (ContaFamilia)

**Testing**: `npm run lint` + `npm run build` (verificação pré-commit obrigatória pela constituição)

**Target Platform**: Mobile-first web (viewport mínimo 375px), PWA-like

**Project Type**: Web app (Next.js App Router, mobile-first)

**Performance Goals**: Saldo exibido < 2s; busca responde < 500ms após parar de digitar; drag-to-reveal < 100ms

**Constraints**: Nenhuma migração Prisma necessária — todas as entidades já existem no schema. `contaFamiliaId` sempre obtido do servidor. Valores monetários sempre `Decimal`.

**Scale/Scope**: Conta familiar com volume esperado de < 500 transações/mês; paginação em 20 itens/página.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Observação |
|-----------|--------|------------|
| I. FSD — dependências entre camadas | ✅ | Hierarquia respeitada: entities → features → widgets → pages → app |
| II. React orientado ao servidor | ✅ | Page e ListaHistoricoTransacoes são Server Components; Client Components apenas para drag, busca e paginação |
| III. Segurança de tipos e validação | ✅ | Tipos inferidos de Zod/Prisma; parâmetros de URL validados com Zod na entrada |
| IV. Isolamento de dados — `contaFamiliaId` do servidor | ✅ | Toda query filtra por `contaFamiliaId` obtido de `obterContextoUsuario()` |
| IV. Valores monetários com `Decimal` | ✅ | `$queryRaw` retorna texto; campos numéricos convertidos via `Decimal` antes de `.toFixed(2)` |
| V. Simplicidade — drag-to-reveal sem biblioteca | ✅ | CSS transform + touch events nativos |
| V. Simplicidade — sem migração desnecessária | ✅ | Nenhuma tabela nova; "transação unificada" é conceito de query, não de persistência |

---

## Project Structure

### Documentation (this feature)

```text
specs/008-dashboard-historico-transacoes/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── TransacaoUnificada.ts
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── entities/
│   └── gasto/
│       ├── api/
│       │   └── consultas.ts          # + listarTransacoesUnificadas, contarTransacoesUnificadas
│       ├── model/
│       │   ├── tipos.ts              # + TipoTransacao, TransacaoUnificada, FiltrosHistorico
│       │   └── schemas.ts            # + schemaFiltrosHistorico (validação searchParams)
│       ├── server.ts                 # + re-exportar novas funções de consultas
│       └── index.ts                  # + re-exportar novos tipos e schemas
│
├── features/
│   └── gastos/
│       └── api/
│           └── acoes.ts              # + excluirGasto (Server Action)
│
├── widgets/
│   └── historico-transacoes/         # novo widget
│       ├── ui/
│       │   ├── ListaHistoricoTransacoes.tsx   # Server Component
│       │   ├── ItemTransacao.tsx              # Client Component (drag-to-reveal)
│       │   ├── BarraBuscaHistorico.tsx        # Client Component
│       │   ├── PaginacaoHistorico.tsx         # Client Component
│       │   ├── EsqueletoHistorico.tsx         # Skeleton loader
│       │   └── DialogoConfirmarExclusao.tsx   # Client Component
│       └── index.ts
│
├── pages/
│   ├── dashboard/                    # novo page
│   │   ├── ui/
│   │   │   └── PaginaDashboard.tsx   # Server Component
│   │   └── index.ts
│   └── editar-gasto/                 # stub page (navegação do drag-to-reveal)
│       ├── ui/
│       │   └── PaginaEditarGasto.tsx # Server Component (stub — escopo completo em feature futura)
│       └── index.ts
│
app/
└── (app)/
    ├── dashboard/
    │   └── page.tsx                  # substituir placeholder por PaginaDashboard
    └── gastos/
        └── [id]/
            └── editar/
                └── page.tsx          # nova rota stub para edição de gasto
```

**Structure Decision**: Single project (Next.js App Router). Novo widget `historico-transacoes` composto por Server + Client Components. Nenhuma opção de estrutura alternativa considerada — o FSD do projeto já define a estrutura.

---

## Complexity Tracking

Nenhuma violação da constituição identificada. Tabela omitida.

---

## Decisions Log

### D-001: Query UNION ALL via `$queryRaw` do Prisma

**Decisão**: Usar `clientePrisma.$queryRaw` com SQL UNION ALL entre `spendings` e `expense_payments JOIN expenses` para obter a lista unificada paginada e ordenada por `created_at DESC`.

**Justificativa**: O Prisma não suporta UNION em seu query builder. A alternativa (buscar ambas as tabelas separadamente e paginar em memória) funciona para volumes pequenos, mas não preserva a ordem global ao paginar — o item mais recente da página 2 pode ser de qualquer tabela. A query UNION ALL é a única forma de garantir ordenação e paginação globais corretas.

**Alternativa rejeitada**: `findMany` separados + merge em memória — falha na paginação global.

**Trade-off**: Raw SQL perde type-safety automática do Prisma; mitigado com tipo explícito na assinatura de retorno e comentário da query para facilitar manutenção.

---

### D-002: Busca e paginação via URL searchParams (SSR)

**Decisão**: Parâmetros `busca` e `pagina` trafegam na URL como searchParams (`/dashboard?busca=mercado&pagina=2`). A página é um Server Component que lê esses params e passa para a query.

**Justificativa**: Permite deep link, compartilhamento de URL, funcionamento correto do botão Voltar do browser, e elimina estado React desnecessário no servidor. Alinha com Princípio II (busca de dados no servidor).

**Implicação**: `BarraBuscaHistorico` é Client Component que faz `router.replace` com debounce de 400ms ao digitar. `PaginacaoHistorico` usa `<Link>` simples.

---

### D-003: Drag-to-reveal sem biblioteca externa

**Decisão**: Implementar drag-to-reveal com `onPointerDown/Move/Up` e CSS `transform: translateX()` controlado por estado React. Threshold de 80px para confirmar o swipe.

**Justificativa**: Princípio V (simplicidade). Biblioteca como `react-swipeable` adicionaria dependência externa para funcionalidade que se implementa em ~60 linhas. O gesto é unidirecional (só esquerda) e não precisa de velocidade/física.

**Comportamento**: Apenas itens com `tipo === "GASTO_DINHEIRO"` respondem ao gesto. Itens de cartão e despesa paga não registram handlers de pointer.

---

### D-004: Nenhuma migração Prisma

**Decisão**: O schema atual já contém todas as entidades necessárias. "Transação Unificada" é um conceito de camada de apresentação/query — não uma entidade persistida.

**Confirmação**: `Gasto` (tabela `spendings`) cobre gastos dinheiro e cartão. `PagamentoDespesa` (tabela `expense_payments`) cobre despesas pagas. `Receita` já é usada no cálculo de saldo existente.

---

### D-005: Tela de edição de gasto — stub

**Decisão**: Criar `app/(app)/gastos/[id]/editar/page.tsx` como stub mínimo (busca o gasto, exibe título). A implementação completa é escopo de feature futura, conforme assumption da spec.

**Justificativa**: O drag-to-reveal precisa de uma rota de destino para `router.push('/gastos/${id}/editar')`. Sem a rota, a navegação resulta em 404.

---

### D-006: Saldo reaproveitado de `obterSaldoMes`

**Decisão**: Reusar `obterSaldoMes(contaFamiliaId, competenciaAtual())` já existente em `src/entities/despesa/api/saldo.ts`. Nenhuma nova função de saldo necessária.

---

### D-007: `PagamentoDespesa` não tem campo `nome` próprio — usa `despesa.nome`

**Decisão**: Na query UNION, o nome da transação `DESPESA_PAGA` é obtido via JOIN com a tabela `expenses` (`d.name`). O valor é `d.amount` (valor da despesa, não do pagamento — `PagamentoDespesa` não tem campo `valor`).

**Confirmação no schema**: `PagamentoDespesa` contém apenas `id`, `despesaId`, `competencia`, `pagoPorId`, `pagoEm` — sem `nome` ou `valor` próprios.
