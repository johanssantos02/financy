# Implementation Plan: Cadastro de cartões de crédito

**Branch**: `004-cadastro-cartoes-credito` | **Date**: 2026-10-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-cadastro-cartoes-credito/spec.md`

## Summary

Adicionar cartões de crédito compartilhados pela conta família: novo modelo Prisma `CartaoCredito`
(`credit_cards`, limite em `Decimal(12, 2)`, FK `RESTRICT` para `ContaFamilia`, nome único por família e
CHECKs de limite/dias) com migration aditiva; entidade `entities/cartao` (schemas Zod, tipos, consultas
`server-only`, item de lista e pré-visualização do cartão); feature `features/cartoes` com as Server
Actions `criarCartao`, `editarCartao` e `excluirCartao` (exclusão só para ADMIN) e um formulário único para
cadastro/edição no estilo de `reference/create_card_example.jpg`; e as rotas `/cartoes`, `/cartoes/novo` e
`/cartoes/[id]/editar`, acessadas pelo item "Cartões" do menu "Mais opções". O limite usado é exibido como
R$ 0,00. Introduz Vitest para cobrir schemas, actions (autorização/isolamento) e formulário.

## Technical Context

**Language/Version**: TypeScript 5 strict — Next.js 16.3.3 App Router, React 19.2

**Primary Dependencies**: Prisma 7.10 (`@prisma/adapter-pg`), Auth.js v5, Zod 4, Tailwind CSS v4,
`react-hot-toast`, `lucide-react` (já instaladas). Novas devDependencies: `vitest`,
`@vitejs/plugin-react`, `vite-tsconfig-paths`, `jsdom`, `@testing-library/react`,
`@testing-library/dom`, `@testing-library/user-event` ([research R10](./research.md#r10-estratégia-de-testes))

**Storage**: PostgreSQL (Supabase) via Prisma — nova tabela `credit_cards` ([data-model.md](./data-model.md))

**Testing**: Vitest (unitário + Testing Library em jsdom), `npm run lint`, `npm run build` e validação
manual ([quickstart.md](./quickstart.md))

**Target Platform**: navegadores mobile (mobile-first), servidor Node do Next.js

**Project Type**: aplicação web Next.js com Feature-Sliced Design

**Performance Goals**: listagem atualizada em até 2 s após mutação (SC-004); validação local instantânea

**Constraints**: `contaFamiliaId`/`usuarioId` só da sessão; toda consulta filtra por `contaFamiliaId`;
exclusão só ADMIN (papel relido do banco); nenhum dado sensível de cartão; migration aditiva; sem envio
duplicado

**Scale/Scope**: 1 modelo + 1 migration, 3 rotas, 3 páginas, 1 entidade, 1 feature (3 actions, formulário,
diálogo de exclusão), ajuste no `SidebarMenu`, extração de 2 utilitários para `shared`, infraestrutura de
testes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Verificação | Status |
|-----------|-------------|--------|
| I. FSD | `app → pages → (widgets) → features/cartoes → entities/cartao → shared`; APIs públicas via `index.ts` e `server.ts`; utilitários compartilhados extraídos para `shared` em vez de import entre entidades (R9) | ✅ |
| II. React no servidor | Páginas e listagem são Server Components; `"use client"` só no formulário, na prévia e no diálogo de exclusão; mutações por Server Actions; nenhum Route Handler | ✅ |
| III. Tipos e validação | Schemas Zod únicos em `entities/cartao` usados no cliente e no servidor; tipos inferidos; `id` da rota validado | ✅ |
| IV. Isolamento e segurança | `contaFamiliaId` da sessão; `where` sempre com `contaFamiliaId`; `select` mínimo; `Decimal(12,2)`; sem dados sensíveis; exclusão ADMIN no servidor | ✅ |
| V. Simplicidade | Sem exclusão lógica, sem repositório genérico, um formulário para criar/editar; extração para `shared` só por repetição real; Vitest é a menor ferramenta que cumpre FR-035 | ✅ |
| Stack e restrições | Migration versionada; mobile-first com breakpoints crescentes; HTML acessível (`<dialog>`, rótulos, `aria-*`); português no domínio | ✅ |
| Fluxo de desenvolvimento | Sequência sessão → Zod → regra → Prisma → `Resultado` → `revalidatePath` em todas as actions; `lint` e `build` obrigatórios; `agents/DOMINIO.md`, `ARQUITETURA.md`, `CONVENCOES.md` e `README.md` atualizados | ✅ |

**Re-check pós-design**: sem violações; a seção Complexity Tracking não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/004-cadastro-cartoes-credito/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── acoes-cartoes.md
├── checklists/
│   └── requirements.md
└── tasks.md             # gerado por /speckit-tasks
```

### Source Code (repository root)

```text
prisma/
├── schema.prisma                                   # + model CartaoCredito, ContaFamilia.cartoes
└── migrations/<timestamp>_criar_cartoes_credito/   # novo (aditivo + CHECKs)

app/(app)/cartoes/
├── page.tsx                                        # → PaginaCartoes
├── loading.tsx                                     # esqueleto da listagem
├── novo/page.tsx                                   # → PaginaNovoCartao
└── [id]/editar/page.tsx                            # → PaginaEditarCartao (notFound se ausente)

src/
├── pages/
│   ├── cartoes/            (index.ts, ui/PaginaCartoes.tsx, ui/EsqueletoCartoes.tsx)
│   ├── novo-cartao/        (index.ts, ui/PaginaNovoCartao.tsx)
│   └── editar-cartao/      (index.ts, ui/PaginaEditarCartao.tsx)
├── widgets/navbar-rodape/ui/SidebarMenu.tsx        # "Cartões" → Link /cartoes
├── features/cartoes/
│   ├── index.ts
│   ├── api/acoes.ts                                # criarCartao, editarCartao, excluirCartao
│   └── ui/
│       ├── FormularioCartao.tsx                    # criar/editar + PreviaCartao
│       └── BotaoExcluirCartao.tsx                  # <dialog> de confirmação
├── entities/cartao/
│   ├── index.ts / server.ts
│   ├── model/schemas.ts, model/tipos.ts
│   ├── api/consultas.ts                            # listarCartoes, obterCartaoPorId, existeNomeCartao
│   └── ui/ItemCartao.tsx, ui/PreviaCartao.tsx
├── entities/despesa/                               # passa a reexportar de shared (sem mudar consumidores)
└── shared/lib/
    ├── moeda/index.ts                              # formatarValor, mascararValor, valorDaMascara
    └── texto/index.ts                              # normalizarNome

tests (colocados ao lado do código, *.test.ts[x]):
├── src/entities/cartao/model/schemas.test.ts
├── src/features/cartoes/api/acoes.test.ts
└── src/features/cartoes/ui/FormularioCartao.test.tsx

vitest.config.mts, package.json (script "test")
agents/DOMINIO.md, ARQUITETURA.md, CONVENCOES.md, README.md   # documentação atualizada
```

**Structure Decision**: segue o FSD vigente e o precedente de despesas (`app` fino → `pages` →
`features` → `entities` → `shared`). A listagem é simples o bastante para ficar na página, sem widget
próprio. Testes ficam ao lado do código para respeitar os limites de cada módulo.

## Implementation Notes

1. **Banco primeiro**: editar schema, `prisma migrate dev --create-only --name criar_cartoes_credito`,
   acrescentar os CHECKs, revisar o SQL (só `credit_cards`), aplicar e `prisma generate`.
2. **Shared**: extrair `moeda` e `texto`; `entities/despesa` reexporta — rodar `lint`/`build` antes de
   seguir.
3. **Entidade e actions** conforme [contracts/acoes-cartoes.md](./contracts/acoes-cartoes.md); mensagens
   de [data-model.md](./data-model.md#validação-mesmo-schema-no-cliente-e-no-servidor).
4. **UI**: listagem (cartões em cards com instituição, nome, barra limite usado/total, Editar e — se
   ADMIN — Excluir), estado vazio com CTA, esqueleto; formulário com prévia em gradiente no topo, campos
   `h-12` arredondados, dias em grid de 2 colunas com `inputMode="numeric"`, botão principal fixo no
   rodapé acima da navbar (com `safe-area`); `max-w-2xl` centralizado em telas maiores.
5. **Testes** (R10) e atualização dos documentos `agents/` e `README.md` (decisão de testes, conceito
   Cartão de crédito, utilitários em `shared`).
6. `SidebarMenu.tsx`/`NavbarRodape.tsx` têm alterações locais não commitadas — preservá-las.
