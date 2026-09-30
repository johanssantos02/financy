# Implementation Plan: CRUD de Despesas

**Branch**: `002-crud-despesas` | **Date**: 2026-09-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-crud-despesas/spec.md`

## Summary

Criar o domínio de despesas compartilhadas por conta família: schema Prisma (`Despesa`,
`PagamentoDespesa`, `Tag`, `DespesaTag`) com migration versionada; regras puras de recorrência
mensal calculada e situação derivada; Server Actions de CRUD e pagamento com resultado
discriminado `{ status, tipo, mensagem }`; e a tela `/despesas` renderizada no servidor, com busca e
filtros via URL (`next/form`), agrupamento Vencidas/Abertas/Pagas, esqueleto de carregamento e
toasts com `react-hot-toast`. O 2º ícone do navbar passa a apontar para `/despesas`.

## Technical Context

**Language/Version**: TypeScript 5 strict — Next.js 16.3.3 App Router, React 19.2

**Primary Dependencies**: Prisma 7 (`@prisma/adapter-pg`), Auth.js v5 (JWT com `role`), Zod 4,
Tailwind CSS v4, `lucide-react`; **novas**: `react-hot-toast`, `server-only`

**Storage**: PostgreSQL (Supabase); 4 tabelas novas via migration `criar_despesas`

**Testing**: sem infraestrutura de testes; funções de domínio puras + validação manual
([quickstart.md](./quickstart.md)), `npm run lint`, `npm run build`

**Target Platform**: navegadores mobile (mobile-first), servidor Node do Next.js

**Project Type**: aplicação web Next.js com Feature-Sliced Design

**Performance Goals**: lista de até 200 despesas/mês renderizada em ≤ 2 s (SC-002); 2 consultas
por carregamento (despesas+tags+pagamentos do mês, tags disponíveis)

**Constraints**: nenhuma regra de negócio no navegador; `usuarioId`/`contaFamiliaId` apenas da
sessão; dinheiro em `Decimal`; datas civis em America/Sao_Paulo; sem rotinas agendadas

**Scale/Scope**: poucas famílias, dezenas a centenas de despesas por família

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Justificativa |
| --- | --- | --- |
| I. Feature-Sliced Design | ✅ PASS | `app → pages/despesas → widgets/lista-despesas → features/despesas → entities/despesa → shared`. Cada módulo expõe `index.ts`. |
| II. React orientado ao servidor | ✅ PASS | Página e lista são Server Components; busca/filtros via `next/form` + `<details>` sem estado React. Client Components apenas `ProvedorNotificacoes` e `NotificarErro` (API do navegador/efeito). Mutações como Server Actions; nenhum Route Handler novo. |
| III. Tipos e validação | ✅ PASS | Zod em `searchParams` e entradas das ações; tipos inferidos dos schemas; sem `any`. |
| IV. Isolamento de dados | ⚠️ PASS com emenda | Contexto resolvido na sessão; toda query filtra por `contaFamiliaId`; `Decimal(12,2)`; `select` explícito. **Emenda necessária**: o texto atual diz "pertence a um único usuário"; despesas agora pertencem à conta família (decisão validada pelo usuário, Q2 = A). Atualizar para "um usuário ou uma conta família" (MINOR 1.1.0) + `agents/DOMINIO.md`. |
| V. Simplicidade | ✅ PASS | Recorrência calculada (sem job, sem pré-geração); sem repositório genérico; filtros de situação em memória. Domínio (`calcularOcorrencias`, `calcularSituacao`) sem dependência de Next/Prisma. |

**Resultado**: gates aprovados; a emenda ao princípio IV integra esta entrega (ver Complexity Tracking).

**Re-check pós-design (Phase 1)**: data-model e contratos mantêm os cinco princípios; nenhuma
violação nova. ✅

## Project Structure

### Documentation (this feature)

```text
specs/002-crud-despesas/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── acoes-despesa.md
│   └── tela-despesas.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
prisma/
  schema.prisma                         # + Despesa, PagamentoDespesa, Tag, DespesaTag; relações em User/ContaFamilia
  migrations/<ts>_criar_despesas/       # NOVA

app/
  layout.tsx                            # + <ProvedorNotificacoes/>
  globals.css                           # + tokens --perigo / --perigo-bg
  (app)/despesas/
    page.tsx                            # NOVA — await searchParams → PaginaDespesas
    loading.tsx                         # NOVA — EsqueletoListaDespesas

src/
  shared/
    lib/resultado/                      # Resultado<T>, ErroAplicacao, TipoErro, criadores de erro, tratarErro
    lib/datas/                          # hojeEmSaoPaulo, competência AAAA-MM, últimoDiaDoMês, somarDias
    lib/sessao/                         # obterContextoUsuario (sessão + conta família)
    ui/notificacoes/                    # ProvedorNotificacoes, NotificarErro, notificarResultado ("use client")
  entities/despesa/
    model/tipos.ts                      # SituacaoDespesa, GrupoSituacao, OcorrenciaDespesa
    model/regras.ts                     # normalizarNome, calcularOcorrencias, calcularSituacao, agruparEOrdenar (puros)
    model/schemas.ts                    # schemaDespesa, schemaFiltrosDespesa, normalizarFiltros, contarFiltros
    api/consultas.ts                    # listarDespesas, obterDespesa, listarTags (Prisma, server-only)
    ui/ItemDespesa.tsx, SeloSituacao.tsx
    index.ts
  features/despesas/
    api/acoes.ts                        # "use server": criar, editar, excluir, marcarComoPaga, desmarcarPagamento, obter
    index.ts
  widgets/lista-despesas/
    ui/BarraBuscaDespesas.tsx           # next/form + painel <details> + indicador/limpar
    ui/ListaDespesas.tsx                # async: chama listarDespesas, grupos, vazio, erro
    ui/EsqueletoListaDespesas.tsx
    index.ts
  widgets/navbar-rodape/ui/NavbarRodape.tsx   # itens[1] → Despesas /despesas (Wallet)
  pages/despesas/
    ui/PaginaDespesas.tsx               # cabeçalho + barra + <Suspense key> lista
    index.ts

agents/DOMINIO.md, agents/ARQUITETURA.md, .specify/memory/constitution.md, README.md  # docs atualizadas
package.json                            # + react-hot-toast, server-only
```

**Structure Decision**: FSD existente. Regras em `entities/despesa/model` (puras, testáveis);
acesso a dados em `entities/despesa/api` (`import "server-only"`); mutações em `features/despesas`;
UI grande em `widgets/lista-despesas`; composição em `pages/despesas`; rota fina em `app`.
Resultado/erros e datas ficam em `shared` por serem reutilizados pelos próximos módulos
(entradas, dívidas) — o formato de erro é requisito transversal da spec (FR-013).

## Key Decisions (detalhes em [research.md](./research.md))

- Recorrência calculada + `PagamentoDespesa` único por `(despesa, competência)` (R1).
- Escopo por conta família, primeira associação do usuário (R2).
- Situação derivada em America/Sao_Paulo, limiar de 5 dias inclusive (R3).
- Exclusão lógica; `nomeNormalizado` anulado ao excluir mantém índice único real (R4).
- Exclusão relê `role` no banco (R5).
- Server Actions retornando `Resultado<T>` com `status/tipo/mensagem`; `P2002`→409 (R6).
- Busca/filtros por URL com `next/form` e `<details>`; esqueleto via `loading.tsx` + `Suspense key` (R7, R8).

## Risks

- **Sessão sem conta família**: usuários atuais podem não ter `ContaFamiliaMembro` → tela vazia
  com aviso; quickstart orienta criar a associação. Seed fica fora do escopo.
- **Fuso horário**: colunas `@db.Date` + cálculo por string `AAAA-MM-DD` evitam deslocamento de
  UTC; qualquer conversão via `new Date()` local deve passar por `shared/lib/datas`.
- **Mudança de navbar**: `/dividas` deixa de ter atalho no navbar até a feature de dívidas.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| Emenda ao princípio IV (dados de conta família) | Requisito validado: membros marcam/desmarcam pagamentos uns dos outros | Despesas por usuário (opção C) contradiz a regra "outro usuário pode desmarcar"; acesso global (opção B) remove o isolamento |
