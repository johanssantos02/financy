# Implementation Plan: Tags em Gastos

**Branch**: `009-tags-gastos` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-tags-gastos/spec.md`

## Summary

Adicionar suporte a tags nos gastos (dinheiro e cartão): novo campo `tipo` no modelo `Tag` (enum
`GASTOS`/`DESPESAS`), nova FK nullable `tagId` em `Gasto`, seletor opcional no modal de criar/editar
gasto, e exibição da tag no histórico e dashboard. Tags e Gastos permanecem por conta família; os 5
valores iniciais são semeados via `prisma/seed.ts`.

## Technical Context

**Language/Version**: TypeScript 5 strict (Next.js 16 App Router, React 19)

**Primary Dependencies**: Prisma ORM 7 · Zod v4 · Tailwind CSS v4 · Auth.js v5 · react-hot-toast

**Storage**: PostgreSQL (Supabase) — conexão agrupada via `DATABASE_URL`; CLI/migrations via `DIRECT_URL`

**Testing**: `npm run lint && npm run build` (nenhum test runner unitário configurado no projeto)

**Target Platform**: Web mobile-first (SSR / RSC-first)

**Project Type**: Web application — Next.js App Router (monorepo único)

**Performance Goals**: Sem metas numéricas explícitas; SC-001 pede que a seleção de tag ocorra em < 5 s

**Constraints**: Sem offline; valores monetários como `Decimal`; `usuarioId`/`contaFamiliaId` apenas no servidor

**Scale/Scope**: Feature incremental sobre CRUD de gastos já existente

## Constitution Check

| Princípio | Status | Observação |
|---|---|---|
| I. FSD (camadas) | ✅ | `entities/tag` → `features/gastos` → `pages/editar-gasto` → `widgets/*` |
| II. RSC-first | ✅ | Seletor de tag é `"use client"` apenas onde há estado; fetch de tags no servidor |
| III. Strict TS + Zod | ✅ | `tagId` validado no schema Zod; tipo inferido |
| IV. Isolamento de dados | ✅ | `contaFamiliaId` obtido da sessão; query filtra por conta |
| IV. Decimal | ✅ | Nenhum campo monetário novo |
| V. Simplicidade | ✅ | FK direta (1:N) em vez de tabela de junção; sem abstração extra |

**Gates**: sem violações.

## Decisão Material — Tags Globais vs. Por Conta Família

A spec afirma "tags são globais à plataforma", mas o modelo `Tag` já existente possui `contaFamiliaId`
e é utilizado pela feature de despesas. Remover o campo quebraria o sistema de tags em despesas.

**Recomendação adotada**: manter tags **por conta família**, satisfazendo FR-005/SC-006 via seed
que insere as 5 tags de tipo `GASTOS` para cada conta ao ser criada (ou via script de seed único
que itera sobre as contas existentes).

> **Aguarda validação do usuário** — ver nota em `research.md`.

## Project Structure

### Documentação (esta feature)

```text
specs/009-tags-gastos/
├── plan.md              ← este arquivo
├── research.md          ← Phase 0
├── data-model.md        ← Phase 1
├── quickstart.md        ← Phase 1
└── contracts/
    └── api-tags-gastos.md
```

### Código-fonte

```text
prisma/
├── schema.prisma                          [alter] enum TipoTag + Tag.tipo + Gasto.tagId
└── migrations/
    └── 20261019000000_tags_gastos/
        └── migration.sql                  [NÃO GERADO AINDA — aguarda validação]

src/
├── entities/
│   ├── tag/                               [novo]
│   │   ├── api/consultas.ts               listarTagsPorTipo()
│   │   ├── model/tipos.ts                 ResumoTag
│   │   ├── model/schemas.ts               schemaTag (para validação server-side)
│   │   └── index.ts
│   └── gasto/
│       ├── model/tipos.ts                 [alter] ResumoGasto + tagId/tagNome
│       ├── model/schemas.ts               [alter] schemaGasto + tagId opcional
│       └── api/consultas.ts               [alter] selecaoGasto + tag include
├── features/
│   └── gastos/
│       ├── api/acoes.ts                   [alter] criarGasto, editarGasto + tagId; nova buscarTagsGasto
│       └── ui/
│           ├── ModalCriarGasto.tsx        [alter] campo SeletorTag
│           └── SeletorTag.tsx             [novo] select controlado, campo opcional
└── pages/
    └── editar-gasto/
        └── ui/PaginaEditarGasto.tsx       [alter] busca tag atual + SeletorTag pré-selecionada
```

**Widgets afetados** (exibição da tag):

```text
src/widgets/
├── lista-despesas/ui/ListaDespesas.tsx    [alter] badge de tag em itens de gasto
└── historico-transacoes/                  [se existir] — incluir tagNome na linha
```

## Complexity Tracking

Sem violações constitucionais. Nenhuma justificativa adicional necessária.
