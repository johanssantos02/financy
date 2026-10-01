# Implementation Plan: Tela de nova despesa

**Branch**: `003-tela-nova-despesa` | **Date**: 2026-10-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-tela-nova-despesa/spec.md`

## Summary

Criar a rota `/despesas/nova` com uma tela de cadastro (título, descrição, aviso de obrigatórios,
formulário e botões Salvar/Cancelar) que reutiliza a Server Action `criarDespesa` já existente — ela
já resolve a conta família pela sessão, valida com Zod e verifica o nome normalizado antes de inserir.
O formulário é um Client Component que valida no cliente com o mesmo `schemaDespesa`, envia via
`onSubmit` + `useTransition` (preservando valores em erro), exibe toast, destaca com borda vermelha e
foca o primeiro campo inválido. O retorno usa `router.back()` quando a tela foi aberta de dentro do app
(parâmetro `origem` enviado pelo menu de criação) e cai em `/despesas` no acesso direto.

## Technical Context

**Language/Version**: TypeScript 5 strict — Next.js 16.3.3 App Router, React 19.2

**Primary Dependencies**: Zod 4, Tailwind CSS v4, `react-hot-toast`, `lucide-react` (todas já
instaladas; nenhuma dependência nova)

**Storage**: PostgreSQL (Supabase) via Prisma 7 — sem alteração de schema/migration

**Testing**: sem infraestrutura de testes; validação manual ([quickstart.md](./quickstart.md)),
`npm run lint`, `npm run build`

**Target Platform**: navegadores mobile (mobile-first), servidor Node do Next.js

**Project Type**: aplicação web Next.js com Feature-Sliced Design

**Performance Goals**: erro de validação local exibido instantaneamente (sem ida ao servidor);
cadastro concluído em < 1 min pelo usuário (SC-001)

**Constraints**: `contaFamiliaId`/`usuarioId` só da sessão; `origem` validado como caminho interno;
valores do formulário preservados em erro; nenhum cadastro duplicado por duplo envio

**Scale/Scope**: 1 rota, 1 página, 1 formulário (5 campos), ajuste no menu de criação

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Justificativa |
| --- | --- | --- |
| I. Feature-Sliced Design | ✅ PASS | `app/(app)/despesas/nova → pages/nova-despesa → features/despesas (FormularioNovaDespesa) → entities/despesa (schema) → shared (formulario, notificacoes, resultado)`. Exposição por `index.ts`. `MenuAcoes` (widget) só muda a URL. |
| II. React orientado ao servidor | ✅ PASS | Página é Server Component; apenas o formulário é Client (estado de erros, foco, transição). Mutação via Server Action existente; nenhum Route Handler. |
| III. Tipos e validação | ✅ PASS | `origem` (searchParam) validado com Zod na página; formulário validado com `schemaDespesa` no cliente e no servidor; tipos inferidos. |
| IV. Isolamento de dados | ✅ PASS | Formulário não envia `contaFamiliaId`/`usuarioId`; a ação os obtém da sessão. `Decimal` mantido. |
| V. Simplicidade | ✅ PASS | Sem biblioteca de formulário; reaproveita ação e schema; única extração (`lerFormData` para `shared`) é exigida pelo uso nos dois lados. |

**Re-check pós-design (Phase 1)**: data-model, contrato e quickstart mantêm os cinco princípios;
nenhuma violação. ✅

## Project Structure

### Documentation (this feature)

```text
specs/003-tela-nova-despesa/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── tela-nova-despesa.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
app/(app)/despesas/nova/
  page.tsx                                  # NOVA — metadata, valida `origem`, renderiza PaginaNovaDespesa

src/pages/nova-despesa/
  index.ts                                  # NOVA
  ui/PaginaNovaDespesa.tsx                  # NOVA — título, descrição, aviso de obrigatórios, formulário

src/features/despesas/
  index.ts                                  # + export FormularioNovaDespesa
  api/acoes.ts                              # lerEntrada passa a usar shared/lib/formulario
  ui/FormularioNovaDespesa.tsx              # NOVA — "use client"; validação, toast, borda, foco, retorno

src/shared/lib/formulario/index.ts          # NOVA — lerFormData (FormData → objeto) e caminhoInterno (Zod)

src/widgets/navbar-rodape/ui/MenuAcoes.tsx  # "Nova despesa" anexa ?origem=<rota atual>
```

**Structure Decision**: aplicação Next.js única com FSD em `src/`; rotas em `app/`. A tela segue o
padrão de `pages/despesas`; a interação de criar fica em `features/despesas`, ao lado da ação.

## Documentação afetada

- `agents/ARQUITETURA.md` ou `agents/CONVENCOES.md`: registrar o padrão de formulário (validação
  cliente+servidor com o mesmo schema, `onSubmit` + `useTransition`, destaque/foco de erro) e a
  convenção `?origem=` para telas de criação.
- `specs/001-footer-navbar`: nenhuma mudança de comportamento do menu além da URL de destino.

## Complexity Tracking

Sem violações à constituição.
