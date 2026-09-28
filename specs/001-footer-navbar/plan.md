# Implementation Plan: Footer Navigation

**Branch**: `001-footer-navbar` | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-footer-navbar/spec.md`

## Summary

Implementar o widget `NavbarRodape` — uma barra de navegação fixa na parte inferior da interface
mobile com cinco slots (quatro rotas + botão de ação central) e um menu flutuante de criação.
O componente é um Client Component puro (sem acesso a dados), integrado via um novo layout do grupo
de rotas `(app)`.

## Technical Context

**Language/Version**: TypeScript 5 strict — Next.js 16 App Router, React 19

**Primary Dependencies**: Tailwind CSS v4, `lucide-react` (a adicionar), `next/navigation` (usePathname, Link)

**Storage**: N/A — feature puramente de UI, sem entidades persistidas

**Testing**: sem infraestrutura de testes definida no projeto; validação manual via quickstart.md

**Target Platform**: Mobile browsers (iOS Safari, Android Chrome); viewport-fit=cover necessário
para safe-area-inset-bottom

**Project Type**: Web application — Next.js App Router com Feature-Sliced Design

**Performance Goals**: Sem metas numéricas definidas; comportamento esperado de apps mobile nativos
(sem janking durante scroll, transição fluida + → ×)

**Constraints**: Sem novas cores; usar tokens CSS existentes; sem overlay sobre o conteúdo;
navbar sempre visível (sem hide-on-scroll)

**Scale/Scope**: Componente único integrado em um layout de grupo de rotas; afeta todas as páginas
autenticadas da aplicação

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Justificativa |
|-----------|--------|---------------|
| I. Feature-Sliced Design | ✅ PASS | Widget em `src/widgets/navbar-rodape/`; integrado via `app/(app)/layout.tsx`. Direção de dependência respeitada. |
| II. React orientado ao servidor | ✅ PASS com justificativa | NavbarRodape é `"use client"` — obrigatório por `usePathname` (estado ativo) e `useState` (toggle do menu). Server Component é impossível para este caso; a justificativa está no domínio do problema. |
| III. Segurança de tipos | ✅ PASS | TypeScript strict; todos os tipos de itens de navegação definidos explicitamente; sem `any`. |
| IV. Isolamento de dados e segurança | N/A | Feature sem acesso a dados ou sessão. |
| V. Simplicidade | ✅ PASS | Estrutura mínima: um widget, um layout. Sem hooks customizados desnecessários, sem biblioteca de UI, sem contexto global. |

**Resultado**: todos os gates passam. Pode avançar para Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-footer-navbar/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── navbar-rodape.md
└── tasks.md             # Phase 2 output (/speckit-tasks — não criado aqui)
```

### Source Code (repository root)

```text
src/
  widgets/
    navbar-rodape/
      ui/
        NavbarRodape.tsx     # Client Component — orquestra navbar + menu
        BotaoAcao.tsx        # Botão central circular (toggle)
        MenuAcoes.tsx        # Menu flutuante de criação
      index.ts               # API pública do widget

app/
  (app)/
    layout.tsx               # NOVO — layout do grupo autenticado; integra NavbarRodape
    dashboard/
      page.tsx               # existente

```

**Structure Decision**: Estrutura de aplicação web com FSD. Widget em `src/widgets/` por ser
um bloco grande e independente de interface. Integrado via layout de grupo de rotas para evitar
repetição em cada página.

## Complexity Tracking

Nenhuma violação de princípios identificada. Seção omitida.
