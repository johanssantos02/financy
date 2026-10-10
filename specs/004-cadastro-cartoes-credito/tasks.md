---

description: "Lista de tarefas — cadastro de cartões de crédito"
---

# Tasks: Cadastro de cartões de crédito

**Input**: Design documents from `specs/004-cadastro-cartoes-credito/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/acoes-cartoes.md](./contracts/acoes-cartoes.md),
[quickstart.md](./quickstart.md)

**Tests**: incluídos — a spec exige cobertura automatizada (FR-035) e o plano adota Vitest (research R10).
Os testes de cada história são escritos antes da implementação e devem falhar primeiro.

**Organization**: tarefas agrupadas por história de usuário. Todas as histórias dependem da Fase 2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: história de usuário da spec (US1…US5)

## Convenções obrigatórias para todas as tarefas

- Seguir `AGENTS.md`, `.specify/memory/constitution.md`, `agents/ARQUITETURA.md` e `agents/CONVENCOES.md`.
  Antes de usar uma API do Next.js, consultar `node_modules/next/dist/docs/`.
- Português em nomes de domínio; FSD `app → pages → widgets → features → entities → shared`; importar
  somente via `index.ts`/`server.ts` de cada módulo.
- Modelo a imitar: despesas (`src/entities/despesa/*`, `src/features/despesas/api/acoes.ts`,
  `src/features/despesas/ui/FormularioNovaDespesa.tsx`, `src/features/despesas/ui/OpcoesDespesa.tsx`).
- `contaFamiliaId`/`usuarioId` vêm somente de `obterContextoUsuario()` (`src/shared/lib/sessao`).
- `src/widgets/navbar-rodape/ui/SidebarMenu.tsx` e `NavbarRodape.tsx` têm alterações locais não
  commitadas: editar sem descartá-las.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: infraestrutura de testes (decisão R10)

- [X] T00- [X] T001 Instalar devDependencies `vitest @vitejs/plugin-react vite-tsconfig-paths jsdom @testing-library/react @testing-library/dom @testing-library/user-event` e adicionar os scripts `"test": "vitest run"` e `"test:watch": "vitest"` em package.json
- [X] T00- [X] T002 Criar vitest.config.mts na raiz com `plugins: [tsconfigPaths(), react()]`, `test.environment: "node"`, `test.include: ["src/**/*.test.{ts,tsx}"]` e `test.setupFiles: ["./vitest.setup.ts"]`; testes de componente declaram `// @vitest-environment jsdom` no topo do arquivo
- [X] T00- [X] T003 Criar vitest.setup.ts na raiz com `vi.mock("server-only", () => ({}))` e `afterEach(cleanup)` de `@testing-library/react`; garantir que `npm test` roda (sem testes, `--passWithNoTests` no script se necessário) e que `npm run lint` não acusa os novos arquivos

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: modelo, migration, utilitários compartilhados e a entidade `cartao` usados por todas as histórias

**⚠️ CRITICAL**: nenhuma história começa antes desta fase

### Banco de dados

- [X] T00- [X] T004 Em prisma/schema.prisma, adicionar `model CartaoCredito` com `@@map("credit_cards")` e os campos: `id String @id @default(uuid()) @db.Uuid`; `contaFamilia ContaFamilia @relation(fields: [contaFamiliaId], references: [id], onDelete: Restrict)`; `contaFamiliaId String @map("family_account_id") @db.Uuid`; `nome String @map("name")`; `nomeNormalizado String @map("normalized_name")`; `instituicao String @map("issuer")`; `limite Decimal @map("credit_limit") @db.Decimal(12, 2)`; `diaFechamento Int @map("closing_day") @db.SmallInt`; `diaVencimento Int @map("due_day") @db.SmallInt`; `criadoEm DateTime @default(now()) @map("created_at") @db.Timestamptz(3)`; `atualizadoEm DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)`; e `@@unique([contaFamiliaId, nomeNormalizado])`. Adicionar `cartoes CartaoCredito[]` em `ContaFamilia`. Não alterar nenhum outro modelo
- [X] T00- [X] T005 Rodar `npx prisma migrate dev --create-only --name criar_cartoes_credito` e editar o prisma/migrations/<timestamp>_criar_cartoes_credito/migration.sql gerado: conferir que contém só `CREATE TABLE "credit_cards"`, o índice único `(family_account_id, normalized_name)` e a FK `ON DELETE RESTRICT ON UPDATE CASCADE`; acrescentar no `CREATE TABLE` as constraints `CONSTRAINT "credit_cards_credit_limit_check" CHECK ("credit_limit" > 0)`, `CONSTRAINT "credit_cards_closing_day_check" CHECK ("closing_day" BETWEEN 1 AND 31)` e `CONSTRAINT "credit_cards_due_day_check" CHECK ("due_day" BETWEEN 1 AND 31)` (depends on T004)
- [X] T00- [X] T006 Aplicar com `npm run db:migrar`, rodar `npm run prisma:gerar` e `npm run prisma:validar`; confirmar que as contagens de `expenses`, `expense_payments`, `tags` e `family_accounts` não mudaram (depends on T005)

### Utilitários compartilhados (research R9)

- [X] T00- [X] T007 [P] Criar src/shared/lib/moeda/index.ts movendo `formatarValor`, `mascararValor`, `valorDaMascara` (e `formatadorMoeda`, `LIMITE_DIGITOS_VALOR`, `centavosDigitados`) de src/entities/despesa/lib/formatacao.ts sem mudar comportamento; formatacao.ts passa a reexportá-los de `@/src/shared/lib/moeda` mantendo `formatarDiaMes` local
- [X] T00- [X] T008 [P] Criar src/shared/lib/texto/index.ts movendo `normalizarNome` de src/entities/despesa/model/regras.ts sem mudar comportamento; regras.ts passa a importá-la e reexportá-la, de modo que `src/entities/despesa/index.ts` e seus consumidores não mudem
- [X] T00- [X] T009 Rodar `npm run lint` e `npm run build` para confirmar que a extração não quebrou despesas (depends on T007, T008)

### Entidade `cartao`

- [X] T0- [X] T010 [P] Criar src/entities/cartao/model/tipos.ts com `ResumoCartao = { id: string; nome: string; instituicao: string; limite: string; limiteUsado: string; diaFechamento: number; diaVencimento: number }` e `DetalheCartao = { id: string; nome: string; instituicao: string; limite: string; diaFechamento: number; diaVencimento: number }` (decimais serializados como string `"1234.56"`)
- [X] T0- [X] T011 [P] Criar src/entities/cartao/model/schemas.ts (Zod 4) com: `nome` "obrigatório, trim, ≤ 60" com mensagens "Informe o nome do cartão." / "O nome deve ter no máximo 60 caracteres."; `instituicao` "obrigatório, trim, ≤ 60" com "Informe a instituição financeira." / "A instituição deve ter no máximo 60 caracteres."; `limite` string trim com regex `^\d{1,10}([.,]\d{1,2})?$` ("Informe um limite válido."), ausente → "Informe o limite.", transform `,`→`.` e refine `> 0` ("O limite deve ser maior que zero."); `diaFechamento` e `diaVencimento` aceitando string numérica ou number, coerced para inteiro 1–31 com "Informe um dia de fechamento entre 1 e 31." / "Informe um dia de vencimento entre 1 e 31."; exportar `schemaCartao = z.object({...})`, `schemaEditarCartao = schemaCartao.extend({ id: z.uuid("Cartão inválido.") })`, `schemaIdCartao = z.object({ id: z.uuid("Cartão inválido.") })` e os tipos `EntradaCartao`, `EntradaEditarCartao` inferidos. Campos extras (ex.: `contaFamiliaId`, `numero`, `cvv`) devem ser descartados (comportamento padrão de `z.object`)
- [X] T0- [X] T012 [P] Criar src/entities/cartao/model/schemas.test.ts cobrindo: entrada válida; nome/instituição vazios e só com espaços; nome com 61 caracteres; limite ausente, "0", "-1", "abc", "1,234" e "12345678901"; limite "5000,5" → "5000.5"; dias "0", "32", "1.5", "abc" rejeitados e "1"/"31" aceitos; campos extras `contaFamiliaId`/`cvv` ausentes do resultado; `schemaEditarCartao` exigindo uuid
- [X] T0- [X] T013 Criar src/entities/cartao/api/consultas.ts com `import "server-only"`, `selecaoCartao` (`satisfies Prisma.CartaoCreditoSelect`, só os campos de `ResumoCartao`) e mapeamento `limite.toFixed(2)`; `listarCartoes(contaFamiliaId)` ordenado por `nome: "asc"` e retornando `limiteUsado: "0.00"` com comentário de que o valor será calculado quando houver vínculo com compras (FR-015); `obterCartaoPorId(contaFamiliaId, id)` via `findFirst({ where: { id, contaFamiliaId } })` retornando `DetalheCartao | null`; `existeNomeCartao(contaFamiliaId, nome, ignorarId?)` usando `normalizarNome` de `@/src/shared/lib/texto` (depends on T006, T008, T010)
- [X] T0- [X] T014 Criar src/entities/cartao/index.ts (tipos, schemas e tipos de entrada; componentes de UI serão adicionados nas histórias) e src/entities/cartao/server.ts reexportando `listarCartoes`, `obterCartaoPorId`, `existeNomeCartao`, com o mesmo comentário de src/entities/despesa/server.ts (depends on T011, T013)
- [X] T0- [X] T015 [P] Criar src/entities/cartao/ui/PreviaCartao.tsx (componente puro, sem `"use client"`) que recebe `{ nome?: string; instituicao?: string; limite?: string; diaFechamento?: string; diaVencimento?: string }` e desenha o cartão da referência reference/create_card_example.jpg: retângulo `rounded-2xl` com gradiente (tokens `primaria`/`info`), ícone `CreditCard`/`Nfc` do lucide-react, instituição no topo, nome em destaque, limite formatado com `formatarValor` e "Fecha dia X · Vence dia Y" no rodapé; textos padrão quando vazio ("Nome do cartão", "Instituição", "R$ 0,00", "--"); `aria-hidden` porque replica dados já rotulados no formulário; exportar em src/entities/cartao/index.ts

**Checkpoint**: banco migrado, entidade pronta, `npm test`, `lint` e `build` passando

---

## Phase 3: User Story 1 - Cadastrar um cartão de crédito (Priority: P1) 🎯 MVP

**Goal**: "Mais opções" → "Cartões" → "Novo cartão" → salvar → confirmação e cartão na listagem

**Independent Test**: quickstart cenários 1–3 — cadastrar um cartão válido, ver o toast e o cartão em `/cartoes`; duplo toque cria apenas um

### Tests for User Story 1 ⚠️

- [X] T0- [X] T016 [P] [US1] Criar src/features/cartoes/api/acoes.test.ts com `vi.mock` de `@/src/shared/lib/sessao` (`obterContextoUsuario`), `@/src/shared/api/prisma` (`clientePrisma.cartaoCredito.*`, `clientePrisma.user.findUnique`), `@/src/entities/cartao/server` e `next/cache` (`revalidatePath`); casos de `criarCartao`: sem sessão → `NAO_AUTENTICADO`; sem família → `SEM_PERMISSAO`; válido → `create` chamado com `contaFamiliaId` da sessão (mesmo enviando outro `contaFamiliaId` no FormData), `nomeNormalizado`, `limite` "5000.00" e dias numéricos, `revalidatePath("/cartoes")` e `sucesso({ id })`
- [X] T0- [X] T017 [P] [US1] Criar src/features/cartoes/ui/FormularioCartao.test.tsx (`// @vitest-environment jsdom`, mock de `next/navigation` `useRouter`, `react-hot-toast` e `../api/acoes`): renderiza os cinco campos rotulados e nenhum campo de número/CVV/validade/titular; envio válido chama `criarCartao` uma única vez mesmo com dois cliques seguidos e chama `router.replace("/cartoes")` após sucesso

### Implementation for User Story 1

- [X] T0- [X] T018 [US1] Criar src/features/cartoes/api/acoes.ts (`"use server"`) com `ROTA_CARTOES = "/cartoes"`, `MENSAGEM_NOME_EM_USO = "Já existe um cartão com este nome."` e `criarCartao(entrada: EntradaFormulario): Promise<Resultado<{ id: string }>>` seguindo `criarDespesa`: contexto → `schemaCartao.safeParse(lerFormData(entrada))` → `erroDeValidacao` → `existeNomeCartao` → `CONFLITO` → `clientePrisma.cartaoCredito.create({ data: { contaFamiliaId, nome, nomeNormalizado: normalizarNome(nome), instituicao, limite, diaFechamento, diaVencimento }, select: { id: true } })` → `revalidatePath(ROTA_CARTOES)`; `catch`: P2002 → `CONFLITO` com a mesma mensagem, senão `tratarErro` (depends on T014; T016 deve passar)
- [X] T0- [X] T019 [US1] Criar src/features/cartoes/ui/FormularioCartao.tsx (`"use client"`) com props `{ modo: "criar" | "editar"; cartao?: DetalheCartao }`, seguindo src/features/despesas/ui/FormularioNovaDespesa.tsx: `CAMPOS = ["nome", "instituicao", "limite", "diaFechamento", "diaVencimento"]` (ordem de foco), `onSubmit` + `useTransition`, `noValidate`, validação no cliente com `schemaCartao` sobre `lerFormData` após `dados.set("limite", valorDaMascara(...))`, toast de erro, `border-perigo` + `aria-invalid` + `aria-describedby`, foco no primeiro inválido, `onInput` limpando o erro do campo, `bloqueado = enviando || concluido`; sucesso → `toast.success("Cartão cadastrado.")`, `setConcluido(true)`, `router.replace("/cartoes")`. Layout da referência: `PreviaCartao` no topo alimentada por estado atualizado no `onInput`; campos `h-12 rounded-2xl` com rótulos visíveis e `*` nos obrigatórios; "Limite total" com `inputMode="numeric"` e `mascararValor` no `onChange`; "Dia de fechamento" e "Dia de vencimento" lado a lado em `grid grid-cols-2 gap-4` com `type="text" inputMode="numeric" maxLength={2}`; botão principal "Salvar cartão" (`h-12 rounded-2xl bg-primaria`, texto "Salvando…" quando bloqueado) em barra fixa no rodapé acima da navbar (`bottom-[calc(64px+env(safe-area-inset-bottom))]`), com espaçamento inferior no form para não cobrir campos (depends on T015, T018; T017 deve passar)
- [X] T0- [X] T020 [US1] Criar src/features/cartoes/index.ts exportando `criarCartao` e `FormularioCartao` (depends on T019)
- [X] T0- [X] T021 [US1] Criar src/pages/novo-cartao/ui/PaginaNovoCartao.tsx e src/pages/novo-cartao/index.ts: `<main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">` com cabeçalho no estilo da referência (botão voltar circular `Link href="/cartoes"` com `aria-label="Voltar"` à esquerda e `<h1>Novo cartão</h1>` centralizado), descrição curta "Cadastre um cartão de crédito da sua família. Não pedimos número nem CVV.", aviso "Campos marcados com * são obrigatórios." e `<FormularioCartao modo="criar" />` (depends on T020)
- [X] T0- [X] T022 [US1] Criar app/(app)/cartoes/novo/page.tsx com `metadata.title = "Novo cartão | Financy"` renderizando `PaginaNovoCartao` (depends on T021)
- [X] T0- [X] T023 [P] [US1] Criar src/entities/cartao/ui/ItemCartao.tsx (Server Component puro) recebendo `{ cartao: ResumoCartao; acoes?: ReactNode }` e exibindo instituição, nome, "Limite usado" e "Limite total" formatados com `formatarValor`, dentro de um `<article>` `rounded-2xl bg-card border border-borda p-4`; exportar em src/entities/cartao/index.ts
- [X] T0- [X] T024 [US1] Criar src/pages/cartoes/ui/PaginaCartoes.tsx e src/pages/cartoes/index.ts (Server Component): `obterContextoUsuario()` → `listarCartoes(contaFamiliaId)`; `<h1>Cartões</h1>`, link "Novo cartão" (`Link href="/cartoes/novo"`, `min-h-11`, ícone `Plus`) e `<ul>` de `ItemCartao` (depends on T023)
- [X] T0- [X] T025 [US1] Criar app/(app)/cartoes/page.tsx com `metadata.title = "Cartões | Financy"` renderizando `PaginaCartoes` (depends on T024)
- [X] T0- [X] T026 [US1] Em src/widgets/navbar-rodape/ui/SidebarMenu.tsx, adicionar `rota: string` em `ItemSidebar` com `rota: "/cartoes"` para "Cartões", trocar o `<button>` por `Link` do `next/link` mantendo as classes, chamar `onFechar` no clique e remover o comentário "Opções ainda sem destino"; preservar as alterações locais existentes

**Checkpoint**: US1 funcional — quickstart cenários 1–3

---

## Phase 4: User Story 2 - Ser orientado quando há erro no preenchimento (Priority: P1)

**Goal**: erros claros por campo, foco no campo inválido e dados preservados (cliente e servidor)

**Independent Test**: quickstart cenário 4

### Tests for User Story 2 ⚠️

- [X] T0- [X] T027 [P] [US2] Em src/features/cartoes/api/acoes.test.ts, adicionar casos de `criarCartao`: entrada inválida → `VALIDACAO` com `campos.nome`/`limite`/`diaFechamento` e `create` não chamado; `existeNomeCartao` true → `CONFLITO` "Já existe um cartão com este nome."; `create` lançando `{ code: "P2002" }` → `CONFLITO`; erro genérico → `ERRO_INTERNO`
- [X] T0- [X] T028 [P] [US2] Em src/features/cartoes/ui/FormularioCartao.test.tsx, adicionar: envio com nome vazio e dia 32 mostra as mensagens, marca `aria-invalid`, foca `nome` e não chama a action; resposta `CONFLITO` do servidor marca o campo `nome` e mantém todos os valores digitados; resposta `VALIDACAO` com `campos` marca os campos correspondentes; digitar no campo remove o erro dele

### Implementation for User Story 2

- [X] T0- [X] T029 [US2] Em src/features/cartoes/ui/FormularioCartao.tsx, completar `errosDoServidor` (`CONFLITO` → campo `nome`; `VALIDACAO` com `campos` → primeira mensagem por campo; demais → só toast) e `MensagemErro` com `id="<campo>-erro"`; garantir que nenhum caminho de erro faça `reset()` do formulário e que o botão volte a ficar habilitado após erro (depends on T019; T027 e T028 devem passar)

**Checkpoint**: US1 + US2 cobrem o cadastro completo

---

## Phase 5: User Story 3 - Consultar os cartões da família (Priority: P1)

**Goal**: listagem completa com limite usado/total, estados de carregamento, erro e vazio, só da família do usuário

**Independent Test**: quickstart cenários 1, 8 e 10 (estado vazio, isolamento, responsivo)

### Tests for User Story 3 ⚠️

- [X] T030 [P] [US3] Criar src/entities/cartao/api/consultas.test.ts (mock de `@/src/shared/api/prisma`): `listarCartoes` filtra `where: { contaFamiliaId }`, ordena por `nome: "asc"`, serializa `limite` com duas casas e devolve `limiteUsado: "0.00"`; `obterCartaoPorId` usa `where: { id, contaFamiliaId }` e devolve `null` quando não encontra; `existeNomeCartao` usa `nomeNormalizado` e respeita `ignorarId`

### Implementation for User Story 3

- [X] T031 [P] [US3] Em src/entities/cartao/ui/ItemCartao.tsx, adicionar barra de uso (`role="meter"` com `aria-valuenow` = limite usado, `aria-valuemax` = limite total, `aria-label="Limite usado"`), "Fecha dia X · Vence dia Y" e área `acoes` alinhada à direita com alvos ≥ 44×44 px; layout em coluna no mobile e `sm:flex-row` quando couber
- [X] T032 [P] [US3] Criar src/pages/cartoes/ui/EsqueletoCartoes.tsx (3 cards `animate-pulse` com a altura do `ItemCartao`, `aria-busy="true"`, texto `sr-only` "Carregando cartões") e exportá-lo em src/pages/cartoes/index.ts
- [X] T033 [US3] Criar app/(app)/cartoes/loading.tsx renderizando o título "Cartões" e `EsqueletoCartoes`, no mesmo formato de app/(app)/despesas/loading.tsx (depends on T032)
- [X] T034 [US3] Em src/pages/cartoes/ui/PaginaCartoes.tsx: tratar contexto sem sucesso e exceção de `listarCartoes` (try/catch com `tratarErro`) exibindo mensagem de erro na tela e `NotificarErro` de `@/src/shared/ui/notificacoes`; estado vazio quando a lista é vazia (ícone `CreditCard`, texto "Nenhum cartão cadastrado" e CTA `Link href="/cartoes/novo"` "Cadastrar primeiro cartão"); lista em `grid gap-3 md:grid-cols-2`; nunca renderizar dados de outra família (depends on T031)

**Checkpoint**: listagem com todos os estados (FR-014 a FR-018, FR-031)

---

## Phase 6: User Story 4 - Editar um cartão (Priority: P2)

**Goal**: formulário carregado com os valores atuais, mesmas validações, listagem atualizada

**Independent Test**: quickstart cenário 5

### Tests for User Story 4 ⚠️

- [X] T035 [P] [US4] Em src/features/cartoes/api/acoes.test.ts, adicionar casos de `editarCartao`: `id` inválido → `VALIDACAO`; `obterCartaoPorId` null (inexistente ou de outra família) → `NAO_ENCONTRADO` "Cartão não encontrado." sem `updateMany`; nome em uso por outro cartão (`existeNomeCartao(..., id)` true) → `CONFLITO`; válido → `updateMany` com `where: { id, contaFamiliaId }` da sessão e `revalidatePath("/cartoes")`; `count: 0` → `NAO_ENCONTRADO`
- [X] T036 [P] [US4] Em src/features/cartoes/ui/FormularioCartao.test.tsx, adicionar: `modo="editar"` preenche os campos com `cartao` (limite exibido mascarado como "R$ 5.000,00"), envia `id` em campo oculto, chama `editarCartao` e mostra "Cartão atualizado."

### Implementation for User Story 4

- [X] T037 [US4] Em src/features/cartoes/api/acoes.ts, adicionar `MENSAGEM_NAO_ENCONTRADO = "Cartão não encontrado."` e `editarCartao(entrada): Promise<Resultado<{ id: string }>>`: contexto → `schemaEditarCartao` → `obterCartaoPorId(contaFamiliaId, id)` null → `NAO_ENCONTRADO` → `existeNomeCartao(contaFamiliaId, nome, id)` → `CONFLITO` → `clientePrisma.cartaoCredito.updateMany({ where: { id, contaFamiliaId }, data: { nome, nomeNormalizado, instituicao, limite, diaFechamento, diaVencimento } })`, `count === 0` → `NAO_ENCONTRADO` → `revalidatePath(ROTA_CARTOES)`; `catch` P2002 → `CONFLITO`, senão `tratarErro`; exportar em src/features/cartoes/index.ts (depends on T018; T035 deve passar)
- [X] T038 [US4] Em src/features/cartoes/ui/FormularioCartao.tsx, suportar `modo="editar"`: `defaultValue` de cada campo a partir de `cartao` (limite via `mascararValor` dos centavos de `cartao.limite`), estado inicial da prévia com os valores atuais, `<input type="hidden" name="id">`, validação com `schemaEditarCartao`, chamada a `editarCartao`, toast "Cartão atualizado." e rótulo do botão "Salvar alterações" (depends on T037; T036 deve passar)
- [X] T039 [US4] Criar src/pages/editar-cartao/ui/PaginaEditarCartao.tsx e src/pages/editar-cartao/index.ts recebendo `cartao: DetalheCartao`, com o mesmo cabeçalho de PaginaNovoCartao (título "Editar cartão") e `<FormularioCartao modo="editar" cartao={cartao} />` (depends on T038)
- [X] T040 [US4] Criar app/(app)/cartoes/[id]/editar/page.tsx (`PageProps<"/cartoes/[id]/editar">`, `await params`): validar `id` com `schemaIdCartao`, `obterContextoUsuario()`, `obterCartaoPorId(contaFamiliaId, id)`; id inválido, contexto sem sucesso ou cartão null → `notFound()` de `next/navigation`; `metadata.title = "Editar cartão | Financy"` (depends on T039)
- [X] T041 [US4] Em src/pages/cartoes/ui/PaginaCartoes.tsx, passar em `acoes` de cada `ItemCartao` um `Link` "Editar" para `/cartoes/${id}/editar` com ícone `Pencil` e `aria-label={`Editar cartão ${nome}`}` (depends on T034)

**Checkpoint**: edição funcional e isolada por família

---

## Phase 7: User Story 5 - Excluir um cartão (Priority: P2)

**Goal**: exclusão com confirmação, só para administradores, sem efeitos colaterais

**Independent Test**: quickstart cenários 6, 7 e 11

### Tests for User Story 5 ⚠️

- [X] T042 [P] [US5] Em src/features/cartoes/api/acoes.test.ts, adicionar casos de `excluirCartao`: `user.findUnique` com `role: "USER"` → `SEM_PERMISSAO` "Apenas administradores podem excluir cartões." sem `deleteMany`; ADMIN e `deleteMany` com `where: { id, contaFamiliaId }` da sessão → `sucesso` e `revalidatePath("/cartoes")`; `count: 0` → `NAO_ENCONTRADO`; erro `{ code: "P2003" }` → `CONFLITO` "Este cartão possui registros vinculados e não pode ser excluído."; nenhum método de `despesa`, `pagamentoDespesa` ou `tag` é chamado
- [X] T043 [P] [US5] Criar src/features/cartoes/ui/BotaoExcluirCartao.test.tsx (`// @vitest-environment jsdom`; `HTMLDialogElement.prototype.showModal/close` stubados): clicar "Excluir" abre o diálogo sem chamar a action; "Cancelar" fecha sem chamar; "Excluir" no diálogo chama `excluirCartao` uma única vez com o `id`, desabilita os botões durante o envio e mostra toast de sucesso ou da mensagem de erro

### Implementation for User Story 5

- [X] T044 [US5] Em src/features/cartoes/api/acoes.ts, adicionar `excluirCartao(entrada): Promise<Resultado<{ id: string }>>`: contexto → `schemaIdCartao` → reler `role` com `clientePrisma.user.findUnique({ where: { id: usuarioId }, select: { role: true } })` (comentário: o token pode estar desatualizado) → não ADMIN → `SEM_PERMISSAO` → `clientePrisma.cartaoCredito.deleteMany({ where: { id, contaFamiliaId } })`, `count === 0` → `NAO_ENCONTRADO` → `revalidatePath(ROTA_CARTOES)`; `catch` P2003 → `CONFLITO` com a mensagem de vínculos, senão `tratarErro`; exportar em src/features/cartoes/index.ts (depends on T037; T042 deve passar)
- [X] T045 [US5] Criar src/features/cartoes/ui/BotaoExcluirCartao.tsx (`"use client"`, props `{ id: string; nome: string }`) seguindo o `<dialog>` nativo de src/features/despesas/ui/OpcoesDespesa.tsx: botão com ícone `Trash2` e `aria-label={`Excluir cartão ${nome}`}`; diálogo com título "Excluir cartão?", texto "O cartão {nome} será removido. Despesas e pagamentos não são afetados.", botões "Cancelar" e "Excluir" (`bg-perigo`); envio com `useTransition`, botões desabilitados enquanto envia, `toast.success("Cartão excluído.")` e fechamento no sucesso, `toast.error(mensagem)` no erro; bottom-sheet no mobile e centralizado em `md:`; exportar em src/features/cartoes/index.ts (depends on T044; T043 deve passar)
- [X] T046 [US5] Em src/pages/cartoes/ui/PaginaCartoes.tsx, renderizar `BotaoExcluirCartao` nas `acoes` de cada item apenas quando `contexto.dados.papel === "ADMIN"` (a permissão real é verificada na action) (depends on T041, T045)

**Checkpoint**: CRUD completo

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T047 [P] Atualizar agents/DOMINIO.md com a seção "Cartão de crédito": pertence a uma conta família; nome único na família (sem diferenciar maiúsculas/minúsculas, ignorando espaços nas extremidades); instituição, limite > 0 e dias de fechamento/vencimento 1–31 obrigatórios; limite usado exibido como R$ 0,00 até existir vínculo com compras; qualquer membro cadastra/edita; apenas administradores excluem; exclusão física, bloqueada quando houver vínculos; nenhum dado sensível de pagamento é armazenado
- [X] T048 [P] Atualizar agents/ARQUITETURA.md (utilitários `src/shared/lib/moeda` e `src/shared/lib/texto`; telas `/cartoes`, `/cartoes/novo`, `/cartoes/[id]/editar`) e agents/CONVENCOES.md (seção "Testes": Vitest, arquivos `*.test.ts[x]` ao lado do código, ambiente `jsdom` por diretiva, mocks de sessão/Prisma/`next/cache`, Server Components async validados manualmente; `npm test` nas verificações de qualidade)
- [X] T049 [P] Atualizar README.md: mover "estratégia e ferramentas de testes" de "Decisões pendentes" para "Decisões vigentes" (Vitest + Testing Library) e incluir `npm test` em "Desenvolvimento"
- [X] T050 Revisar acessibilidade e responsividade das telas de cartões em 320 px, 375 px e 1440 px: sem rolagem horizontal, alvos ≥ 44×44 px, ordem de foco, Esc no diálogo e foco devolvido ao botão "Excluir" ao fechar (src/pages/cartoes, src/pages/novo-cartao, src/pages/editar-cartao, src/features/cartoes/ui)
- [X] T051 Rodar `npm test`, `npm run lint` e `npm run build` e corrigir falhas
- [X] T052 Executar todos os cenários de specs/004-cadastro-cartoes-credito/quickstart.md, incluindo conferir que `credit_cards` não tem colunas sensíveis e que excluir uma família com cartões é bloqueado pela FK

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sem dependências
- **Foundational (Fase 2)**: depende da Fase 1 — bloqueia todas as histórias
- **US1 (Fase 3)**: depende da Fase 2 — MVP
- **US2 (Fase 4)**: depende de T019 (formulário da US1)
- **US3 (Fase 5)**: depende de T024 (página da listagem criada na US1); T030 só depende da Fase 2
- **US4 (Fase 6)**: depende de T018/T019 (actions e formulário) e de T034 para o link "Editar"
- **US5 (Fase 7)**: depende de T037 (arquivo de actions) e de T041 (área de ações na listagem)
- **Polish (Fase 8)**: depende das histórias desejadas

### User Story Dependencies

```text
Fase 1 → Fase 2 → US1 ─┬→ US2
                       ├→ US3 ─┬→ US4 → US5
                       └───────┘
```

US2 e US3 podem ser feitas em paralelo após a US1. US4 e US5 compartilham `acoes.ts` e `PaginaCartoes.tsx`, então são sequenciais.

### Within Each User Story

- Testes primeiro, falhando; depois implementação
- Entidade → action → componente → página → rota

### Parallel Opportunities

- Fase 2: T007, T008, T010, T011, T012 e T015 em paralelo (arquivos distintos); T013 após T006/T008/T010
- US1: T016, T017 e T023 em paralelo
- US2 × US3: T027/T028 e T030/T031/T032 em paralelo
- US4: T035 e T036 em paralelo
- US5: T042 e T043 em paralelo
- Polish: T047, T048 e T049 em paralelo

---

## Parallel Example: User Story 1

```text
Task: "T016 [US1] Testes de criarCartao em src/features/cartoes/api/acoes.test.ts"
Task: "T017 [US1] Testes do FormularioCartao em src/features/cartoes/ui/FormularioCartao.test.tsx"
Task: "T023 [US1] ItemCartao em src/entities/cartao/ui/ItemCartao.tsx"
```

## Parallel Example: User Stories 2 e 3

```text
Task: "T027 [US2] Casos de erro de criarCartao em src/features/cartoes/api/acoes.test.ts"
Task: "T030 [US3] Testes das consultas em src/entities/cartao/api/consultas.test.ts"
Task: "T032 [US3] EsqueletoCartoes em src/pages/cartoes/ui/EsqueletoCartoes.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Fase 1 (Vitest) e Fase 2 (migration, utilitários, entidade)
2. Fase 3 (US1): cadastro e listagem básica acessíveis pelo menu
3. **Parar e validar**: quickstart cenários 1–3, `npm test`, `lint`, `build`

### Incremental Delivery

1. US1 → cadastro utilizável
2. US2 + US3 → erros guiados e listagem com todos os estados (fecha todos os P1)
3. US4 → edição
4. US5 → exclusão restrita a administradores
5. Polish → documentação, acessibilidade e validação completa

---

## Notes

- [P] = arquivos distintos sem dependência pendente
- Commitar ao fim de cada fase ou grupo lógico
- Não armazenar nem pedir número, CVV, validade ou titular em nenhuma tarefa
- `contaFamiliaId` do cliente é sempre ignorado; testes devem provar isso
