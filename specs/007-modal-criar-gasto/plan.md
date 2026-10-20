# Implementation Plan: Modal de Criar Gasto

**Branch**: `007-modal-criar-gasto` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-modal-criar-gasto/spec.md`

## Summary

Implementar o modal de criação de gasto pontual (`Gasto`), entidade semanticamente distinta de `Despesa` (conta a pagar recorrente). O modal suporta pagamento em dinheiro e cartão de crédito, valida o limite do cartão via bloqueio pessimista (`SELECT … FOR UPDATE`) e atualiza o saldo computado da conta família ao inserir o registro.

## Technical Context

**Language/Version**: TypeScript 5.x — strict mode habilitado

**Primary Dependencies**: Next.js 16 App Router · React 19 · Prisma ORM 7 · Zod v4 · Auth.js v5 · Tailwind CSS v4

**Storage**: PostgreSQL via Supabase — `DATABASE_URL` para runtime, `DIRECT_URL` para migrations CLI

**Testing**: `npm run lint` + `npm run build` (sem framework de testes unitários em uso ativo)

**Target Platform**: Web mobile-first (App Router Server + Client Components)

**Project Type**: Web application — FSD (Feature-Sliced Design)

**Performance Goals**: Registro de gasto < 30 s (end-to-end conforme SC-001); transação atômica cartão/família

**Constraints**: Sem ponto flutuante em valores monetários (`Decimal(12,2)`); `contaFamiliaId` e `usuarioId` nunca recebidos do cliente

**Scale/Scope**: Membros da mesma conta família concorrendo; sem requisito de escala além disso

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Observação |
|-----------|--------|------------|
| I. FSD — direção de dependências | ✅ | `entities/gasto` → sem deps de camadas superiores |
| II. React orientado ao servidor | ✅ | Server Action para mutação; busca de cartões no servidor |
| III. TypeScript strict + Zod na fronteira | ✅ | Schema Zod valida FormData antes de qualquer persistência |
| IV. `usuarioId`/`contaFamiliaId` da sessão | ✅ | `obterContextoUsuario()` no Server Action — nunca do cliente |
| IV. Valores monetários em `Decimal` | ✅ | Todos os campos `valor`/`limite`/`limiteUsado` em `Decimal(12,2)` |
| IV. SELECT FOR UPDATE no cartão | ✅ | Transação Prisma com `$queryRaw … FOR UPDATE` |
| V. Simplicidade — sem abstrações prematuras | ✅ | Modal Client Component simples; sem estado global / repositório |

**Resultado**: Aprovado em todos os gates. Nenhuma violação justificável pendente.

## Project Structure

### Documentation (this feature)

```text
specs/007-modal-criar-gasto/
├── plan.md              # Este arquivo
├── research.md          # Fase 0: decisões e investigações
├── data-model.md        # Fase 1: modelo de dados e migration
├── quickstart.md        # Fase 1: guia de validação end-to-end
├── contracts/
│   └── criar-gasto.md   # Fase 1: contrato do Server Action
└── tasks.md             # Fase 2: gerado por /speckit-tasks
```

### Source Code (repository root)

```text
prisma/
└── migrations/
    └── <timestamp>_adicionar_gasto/   # nova migration

src/entities/gasto/
├── model/
│   ├── schemas.ts        # Zod: schemaGasto, tipos inferidos
│   ├── tipos.ts          # TypeScript: ResumoGasto, DetalheGasto
│   └── regras.ts         # Funções puras de domínio (sem deps de framework)
├── api/
│   └── consultas.ts      # server-only: listarGastos()
├── index.ts              # exports públicos (sem deps de servidor)
└── server.ts             # exports exclusivos do servidor

src/features/gastos/
├── api/
│   └── acoes.ts          # "use server": criarGasto()
├── ui/
│   ├── ModalCriarGasto.tsx      # "use client": dialog + trigger
│   └── FormularioCriarGasto.tsx # "use client": formulário interno
└── index.ts

src/widgets/lista-gastos/
├── ui/
│   └── ListaGastos.tsx   # Server Component: lista de gastos da família
└── index.ts

# Alterações em arquivos existentes:
src/entities/cartao/api/consultas.ts    # listarCartoesParaSelecao() — sem limiteUsado hardcoded
src/entities/despesa/api/saldo.ts       # obterSaldoMes() — inclui gastos no cálculo
app/(app)/despesas/page.tsx             # integra ModalCriarGasto + ListaGastos
```

**Structure Decision**: FSD estrito. `entities/gasto` expõe tipos e schemas; `features/gastos` contém o Server Action e o formulário modal; `widgets/lista-gastos` monta a listagem. A tela de despesas integra os dois novos widgets.

## Complexity Tracking

> Nenhuma violação de constitution. Seção não aplicável.
