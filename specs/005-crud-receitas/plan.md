# Implementation Plan: Gerenciamento de Receitas/Entradas

**Branch**: `005-crud-receitas` | **Date**: 2026-10-13 | **Spec**: [spec.md](spec.md)

## Summary

Implementar CRUD de receitas/entradas financeiras para conta família: cadastro e edição via `<dialog>` modal na tela `/entradas`, exclusão com confirmação (exclusão física, somente ADMIN). Nova entidade `Receita` no Prisma com `TipoReceita` enum (`SALARIO` | `OUTRO`) e `competencia` opcional (obrigatória para salários, armazenada como primeiro dia do mês em `@db.Date`). Segue o padrão FSD e Server Actions já consolidado no projeto.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode obrigatório)

**Primary Dependencies**: Next.js 16 App Router · React 19 · Zod v4 · Prisma ORM 7 · Tailwind v4 · Auth.js v5 · react-hot-toast · Lucide React

**Storage**: PostgreSQL (Supabase) · `DATABASE_URL` para app · `DIRECT_URL` para migrations

**Testing**: Vitest

**Target Platform**: Web browser — mobile-first (320px+), desktop suportado

**Project Type**: Full-stack Next.js (App Router)

**Performance Goals**: Interações sub-segundo; zero registros duplicados sob submissões concorrentes

**Constraints**:
- `usuarioId` e `contaFamiliaId` exclusivamente do servidor (`obterContextoUsuario`)
- `Decimal(12, 2)` para valores monetários — aritmética de ponto flutuante proibida
- Datas circulam como string `AAAA-MM-DD`; competências como `AAAA-MM`
- Fuso `America/Sao_Paulo`; competência armazenada como `@db.Date` UTC para evitar deslocamento

**Scale/Scope**: App familiar de pequeno porte; sem requisitos de alta concorrência

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|-----------|-----------|
| **I. FSD** | `entities/receita` ← `features/receitas` ← `pages/entradas` ← `app/`. Sem violações de direção. ✅ |
| **II. RSC** | `PaginaEntradas` busca dados no servidor. Mutações via Server Actions (`"use server"`). `"use client"` apenas no modal e componentes de interação. ✅ |
| **III. Zod/TypeScript** | Schemas Zod em `entities/receita/model/schemas.ts`; tipos inferidos; `strict` ativo. ✅ |
| **IV. Isolamento e segurança** | `contaFamiliaId` e `usuarioId` via `obterContextoUsuario()`; nunca do cliente. `Decimal(12, 2)` para valor. Exclusão verifica `role` relido do banco. ✅ |
| **V. Simplicidade** | Reutiliza `<dialog>` nativo, padrão de formulário, `Resultado<T>`, `tratarErro`. Sem abstrações novas. ✅ |

Todos os gates passam. Sem violações a justificar.

## Project Structure

### Documentation (this feature)

```text
specs/005-crud-receitas/
├── plan.md              ← este arquivo
├── research.md          ← decisões de design (Phase 0)
├── data-model.md        ← modelo Prisma e schemas (Phase 1)
├── contracts/
│   ├── acoes-receitas.md   ← Server Actions (Phase 1)
│   └── tela-receitas.md    ← UI / rotas (Phase 1)
├── quickstart.md        ← guia de validação (Phase 1)
└── tasks.md             ← (Phase 2 — /speckit-tasks)
```

### Source Code (repository root)

```text
prisma/
├── schema.prisma                 ← adicionar TipoReceita enum + model Receita
└── migrations/<ts>_criar_receitas/migration.sql

src/
├── entities/receita/
│   ├── api/consultas.ts          ← listarReceitas, obterReceitaPorId
│   ├── model/
│   │   ├── schemas.ts            ← schemaReceita, schemaEditarReceita, schemaIdReceita
│   │   └── tipos.ts              ← TipoReceita, ResumoReceita, DetalheReceita
│   ├── server.ts                 ← server-only helpers
│   └── index.ts                  ← API pública da entidade
│
├── features/receitas/
│   ├── api/acoes.ts              ← criarReceita, editarReceita, excluirReceita
│   ├── ui/
│   │   ├── ModalReceita.tsx      ← <dialog> com formulário (modo criar + editar)
│   │   └── BotaoExcluirReceita.tsx
│   └── index.ts
│
├── pages/entradas/
│   ├── ui/PaginaEntradas.tsx     ← Server Component; lista + botão "Nova entrada"
│   └── index.ts
│
└── widgets/navbar-rodape/ui/MenuAcoes.tsx  ← atualizar rota de "/entradas/nova" → "/entradas"

app/(app)/
└── entradas/
    └── page.tsx                  ← metadados + PaginaEntradas
```

**Structure Decision**: seguiu Feature-Sliced Design estritamente. A tela de entradas é uma `page` FSD que compõe entidade + feature. Não foi criado widget separado para a lista de entradas — adicionado diretamente na página (FSD permite quando widget não é compartilhado).

## Complexity Tracking

> Sem violações de constituição a justificar.
