# Research: Cadastro de cartões de crédito

**Feature**: `004-cadastro-cartoes-credito` | **Date**: 2026-10-10

Decisões que resolvem as incógnitas do Technical Context. Os fatos vêm do código atual
(`prisma/schema.prisma`, `src/features/despesas`, `src/shared/lib/*`, `agents/*`) e da documentação
instalada do Next.js 16 (`node_modules/next/dist/docs`).

## R1. Modelagem do cartão e tipo monetário

- **Decision**: novo modelo `CartaoCredito` (tabela `credit_cards`) com `limite Decimal @db.Decimal(12, 2)`,
  dias como `Int @db.SmallInt`, `nomeNormalizado` obrigatório e `@@unique([contaFamiliaId, nomeNormalizado])`.
  Nomes de campos em português e colunas em inglês com `@map`, como `Despesa` e `Tag`.
- **Rationale**: `Decimal(12, 2)` é o mesmo tipo de `Despesa.valor` e casa com a validação já usada
  (até 10 dígitos inteiros e 2 decimais). A unicidade composta repete o padrão de despesas e tags e
  protege contra corrida entre duas criações simultâneas (P2002).
- **Alternatives considered**: `Float`/`Int` em centavos — proibido/fora do padrão (constituição IV);
  `Decimal` sem precisão — inconsistente com o resto do schema.

## R2. Comportamento de exclusão (ContaFamilia → cartões)

- **Decision**: relação obrigatória com `onDelete: Restrict` explícito; sem cascata. O cartão é excluído
  fisicamente (sem `excluidoEm`).
- **Rationale**: todas as relações com `ContaFamilia` hoje usam o padrão do Prisma para relação
  obrigatória (`RESTRICT`); deixar explícito documenta a regra FR-027. Exclusão lógica em despesas
  existe para preservar pagamentos e ocorrências passadas — cartões ainda não têm vínculos, então a
  exclusão lógica só adicionaria filtro em toda consulta sem benefício (constituição V). Quando
  compras/faturas apontarem para o cartão, essas FKs usarão `RESTRICT` e a action converterá o erro
  P2003 em `CONFLITO` (FR-021).
- **Alternatives considered**: `Cascade` — viola FR-027; exclusão lógica — complexidade sem uso real.

## R3. Restrições no banco (CHECK)

- **Decision**: a migration gerada recebe, à mão, `CHECK (credit_limit > 0)` e
  `CHECK (closing_day BETWEEN 1 AND 31)` / `CHECK (due_day BETWEEN 1 AND 31)`.
- **Rationale**: defesa em profundidade para FR-008/FR-009 sem custo; o Prisma não modela CHECK, mas
  preserva SQL manual na migration e não gera drift por ele.
- **Alternatives considered**: apenas Zod — suficiente para a aplicação, mas deixa o banco aceitar dados
  inválidos vindos de scripts/seed.

## R4. Autorização e permissões

- **Decision**: toda action chama `obterContextoUsuario()` (sessão → `usuarioId`, `papel`,
  `contaFamiliaId`) e filtra por `contaFamiliaId` em todo `where`. Criar/editar: qualquer membro.
  Excluir: apenas `role = ADMIN`, relido do banco (mesmo padrão de `excluirDespesa`). A UI recebe o papel
  da sessão só para ocultar o botão.
- **Rationale**: decisão do usuário na spec (FR-023); reaproveita o mecanismo existente, sem novo
  conceito de permissão. Cartão de outra família → `NAO_ENCONTRADO`, sem revelar existência (FR-026).
- **Alternatives considered**: usar `MembroFuncao.PROPRIETARIO` — rejeitado pelo usuário.

## R5. Limite usado

- **Decision**: não persistido; a camada de entidade expõe `limiteUsado: "0.00"` em todo resumo de cartão,
  e a UI o exibe com barra de uso vazia.
- **Rationale**: decisão do usuário (FR-015). Concentrar o valor em um único ponto do mapeamento permite
  trocar pelo cálculo real depois sem tocar na UI.

## R6. Rotas, telas e navegação

- **Decision**: `/cartoes` (listagem), `/cartoes/novo` (cadastro) e `/cartoes/[id]/editar` (edição), no
  grupo `app/(app)` (com navbar). O item "Cartões" do `SidebarMenu` vira `Link` para `/cartoes`.
  Cadastro e edição voltam para `/cartoes` com `router.replace` após sucesso ou cancelamento.
- **Rationale**: telas próprias, como `/despesas/nova` (spec, Assumptions). Não usamos `?origem=` porque o
  único ponto de entrada é a listagem. A edição busca o cartão no servidor e chama `notFound()` quando
  ele não existe ou é de outra família.
- **Alternatives considered**: modal/bottom-sheet na listagem — mais estado no cliente e foge da
  referência visual de tela cheia.

## R7. Atualização da listagem após mutação

- **Decision**: `revalidatePath("/cartoes")` nas actions, seguido de `router.replace("/cartoes")` no
  cliente.
- **Rationale**: segundo `revalidatePath.md`, em Server Functions a UI é atualizada imediatamente; é o
  mesmo mecanismo de despesas. Exclusão acontece na própria listagem e é refletida pelo revalidate.

## R8. Formulário (cadastro e edição)

- **Decision**: um único Client Component `FormularioCartao` com `modo: "criar" | "editar"` e valores
  iniciais opcionais; mesmas convenções de `FormularioNovaDespesa` (`onSubmit` + `useTransition`,
  validação no cliente com o mesmo schema Zod, toast, `border-perigo`, `aria-invalid`, foco no primeiro
  inválido, botão bloqueado durante e após o sucesso). Pré-visualização (`PreviaCartao`) recebe os
  valores digitados via estado controlado leve (`onInput` no form).
- **Rationale**: cadastro e edição compartilham 100% dos campos e regras; duas cópias seriam repetição
  real. A pré-visualização segue a referência `reference/create_card_example.jpg`.

## R9. Reuso de máscara/formatação monetária e normalização de nome

- **Decision**: mover `formatarValor`, `mascararValor` e `valorDaMascara` para `src/shared/lib/moeda` e
  `normalizarNome` para `src/shared/lib/texto`; `entities/despesa` passa a reexportá-los, sem alterar
  seus consumidores.
- **Rationale**: FSD proíbe `entities/cartao` importar de `entities/despesa`; agora há repetição real
  (segunda entidade), o que justifica a extração (constituição V). Reexportar mantém o diff mínimo.
- **Alternatives considered**: duplicar o código em `entities/cartao` — divergência futura de regras de
  moeda; import cruzado `@x` — exceção FSD desnecessária para utilitários genéricos.

## R10. Estratégia de testes

- **Decision**: adotar **Vitest** (`vitest`, `@vitejs/plugin-react`, `vite-tsconfig-paths`, `jsdom`,
  `@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`) com script
  `npm test`. Cobertura:
  1. schemas e regras (`entities/cartao`) — ambiente `node`;
  2. Server Actions com `vi.mock` de `@/src/shared/lib/sessao`, `@/src/shared/api/prisma`,
     `next/cache` e `server-only` — criação, edição, exclusão, permissão de admin e isolamento
     (asserção de que todo `where` inclui o `contaFamiliaId` da sessão e ignora o enviado pelo cliente);
  3. `FormularioCartao` com Testing Library em `jsdom` — validação no cliente, preservação de valores
     em erro e bloqueio de envio duplicado.
  Páginas `async` (Server Components) ficam na validação manual do quickstart, conforme a limitação
  documentada em `01-app/02-guides/testing/vitest.md`.
- **Rationale**: é a ferramenta documentada pelo Next.js instalado, roda TS/ESM sem configuração extra e
  cobre FR-035 sem banco real. Fecha a decisão pendente "estratégia e ferramentas de testes" do README.
- **Alternatives considered**: Jest — exige mais configuração para ESM/TS; Playwright E2E — exige banco e
  usuários de teste, custo alto para esta entrega (pode vir depois).
