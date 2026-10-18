# Tasks: Gerenciamento de Receitas/Entradas

**Input**: Design documents from `specs/005-crud-receitas/`

**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/ ✅

**Tests**: Não solicitados nesta spec — sem tarefas de teste.

**Organization**: Tarefas agrupadas por user story para implementação e validação independente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências incompletas)
- **[Story]**: User story a que a tarefa pertence (US1, US2, US3)

---

## Phase 1: Setup (Estrutura de Módulos)

**Purpose**: Criar a estrutura de diretórios FSD para a feature. Não há dependência de projeto externo — o projeto já existe.

- [X] T001 Criar diretórios `src/entities/receita/api/`, `src/entities/receita/model/`, `src/features/receitas/api/`, `src/features/receitas/ui/`, `src/pages/entradas/ui/` e `app/(app)/entradas/`

---

## Phase 2: Foundational (Pré-requisitos bloqueantes)

**Purpose**: Modelo Prisma, migration e camada de entidade. Nenhuma user story pode começar sem esta fase.

**⚠️ CRÍTICO**: Todo o trabalho de user stories depende desta fase.

- [X] T002 Adicionar `enum TipoReceita { SALARIO @map("salary") OUTRO @map("other") @@map("income_types") }` e model `Receita` em `prisma/schema.prisma`; incluir relações inversas em `User` (`receitasCriadas Receita[] @relation("ReceitaCriadaPor")`) e `ContaFamilia` (`receitas Receita[]`); campos: `id Uuid PK uuid()`, `contaFamiliaId FK Restrict`, `criadoPorId FK`, `valor Decimal(12,2)`, `tipo TipoReceita`, `descricao String?`, `competencia DateTime? @db.Date`, `criadoEm Timestamptz(3) now()`, `atualizadoEm Timestamptz(3) @updatedAt`, `@@index([contaFamiliaId, criadoEm])`, `@@map("incomes")`

- [X] T003 Gerar migration com `npx prisma migrate dev --create-only --name criar_receitas`; revisar `prisma/migrations/<ts>_criar_receitas/migration.sql` para adicionar manualmente `ALTER TABLE "incomes" ADD CONSTRAINT "incomes_amount_check" CHECK (amount > 0);` após a criação da tabela; aplicar com `npx prisma migrate dev`

- [X] T004 [P] Criar `src/entities/receita/model/tipos.ts` com: `TipoReceita = "SALARIO" | "OUTRO"`; `ResumoReceita = { id: string; valor: string; tipo: TipoReceita; descricao: string | null; competencia: string | null }` (competência serializada como `"AAAA-MM"` ou `null`); `DetalheReceita` igual a `ResumoReceita`

- [X] T005 [P] Criar `src/entities/receita/model/schemas.ts` com: `schemaValor` (string; regex `^\d{1,10}([.,]\d{1,2})?$`; replace `,` → `.`; refine `> 0`; mensagens: "Informe o valor." / "Informe um valor válido." / "O valor deve ser maior que zero."); `schemaDescricao` (string opcional; trim; max 500; `""` → `null`); `schemaTipoReceita` (`z.enum(["SALARIO", "OUTRO"])`; mensagem: "Informe o tipo."); `schemaCompetencia` (`z.string().refine(ehCompetenciaValida, "Informe o mês de recebimento.")`); `schemaReceita` com `superRefine` que adiciona issue em `competencia` se `tipo === "SALARIO" && !competencia`; `schemaEditarReceita` estende `schemaReceita` com `id: z.uuid("Receita inválida.")`; `schemaIdReceita = z.object({ id: z.uuid("Receita inválida.") })`; exportar tipos inferidos `EntradaReceita`, `EntradaEditarReceita`

- [X] T006 Criar `src/entities/receita/api/consultas.ts` com: `listarReceitas(contaFamiliaId: string): Promise<ResumoReceita[]>` usando `clientePrisma.receita.findMany({ where: { contaFamiliaId }, orderBy: { criadoEm: "desc" }, select: { id, valor, tipo, descricao, competencia } })`; serializar `valor` com `.toFixed(2)` e `competencia` com `deDataBanco(competencia).slice(0, 7)` quando não `null`; `obterReceitaPorId(contaFamiliaId, id): Promise<DetalheReceita | null>` usando `findFirst({ where: { id, contaFamiliaId } })`

- [X] T007 Criar `src/entities/receita/server.ts` com `import "server-only"` re-exportando `listarReceitas` e `obterReceitaPorId` de `./api/consultas`

- [X] T008 Criar `src/entities/receita/index.ts` exportando tipos (`TipoReceita`, `ResumoReceita`, `DetalheReceita`, `EntradaReceita`, `EntradaEditarReceita`) e schemas (`schemaReceita`, `schemaEditarReceita`, `schemaIdReceita`) de `./model/tipos` e `./model/schemas`

**Checkpoint**: Entidade completa — tipos, schemas Zod, consultas Prisma prontos. User stories podem começar.

---

## Phase 3: User Story 1 — Cadastrar Receita (Priority: P1) 🎯 MVP

**Goal**: Membro da conta família consegue abrir o modal pelo botão "+" do footer → "Nova entrada" → preencher valor, tipo, descrição e competência (se Salário) → salvar e ver a receita na lista.

**Independent Test**: Abrir `/entradas`, clicar "Nova entrada", cadastrar receita do tipo Salário com valor e competência → registro aparece na lista; tentar salvar sem valor → erro inline.

### Implementation for User Story 1

- [X] T009 [US1] Criar `src/features/receitas/api/acoes.ts` com `"use server"` e função `criarReceita(entrada: EntradaFormulario): Promise<Resultado<{ id: string }>>`: chamar `obterContextoUsuario()` → retornar se falhar; `schemaReceita.safeParse(lerFormData(entrada))`; se `tipo === "OUTRO"` forçar `competencia: null`; `clientePrisma.receita.create({ data: { contaFamiliaId, criadoPorId: usuarioId, valor: dados.valor, tipo: dados.tipo, descricao: dados.descricao ?? null, competencia: dados.competencia ? paraDataBanco(inicioDaCompetencia(dados.competencia)) : null } })`; `revalidatePath("/entradas")`; retornar `sucesso({ id })`; capturar erros com `tratarErro`

- [X] T010 [US1] Criar `src/features/receitas/ui/ModalReceita.tsx` como Client Component com `<dialog>` nativo: props `{ modo: "criar" | "editar"; receita?: DetalheReceita; aberto: boolean; onFechar: () => void }`; `useEffect` para `dialog.current?.showModal()` / `close()` conforme `aberto`; fechar ao clicar no backdrop (`onClick` no `<dialog>` quando `target === currentTarget`); CSS bottom-sheet: `mx-auto mb-0 mt-auto w-full max-w-none rounded-t-2xl bg-card p-0 shadow-lg backdrop:bg-black/40 md:my-auto md:max-w-sm md:rounded-2xl`; formulário com campos: **Valor** (`input type="text" inputMode="numeric"` com `mascararValor`/`valorDaMascara`), **Tipo** (`select` com opções "Salário" e "Outro"), **Descrição** (`textarea` max 500), **Mês de recebimento** (`input type="month"`, visível somente quando `tipo === "SALARIO"`, limpar valor quando alternar para "Outro"); validação client-side com `schemaReceita.safeParse` antes de enviar; `useTransition` para loading — botão desabilitado durante envio; sucesso: `toast.success("Receita cadastrada.")` + `onFechar()`; erro: `toast.error(...)` + erros inline por campo preservando dados preenchidos; acessibilidade: `<label htmlFor>` para cada campo, `aria-invalid` + `aria-describedby` nos campos com erro

- [X] T011 [US1] Criar `src/pages/entradas/ui/PaginaEntradas.tsx` como Server Component: recebe `receitas: ResumoReceita[]` e `papel: "USER" | "ADMIN"` como props; botão "Nova entrada" abre `ModalReceita modo="criar"` (estado de abertura via Client Component wrapper ou `"use client"` com ilha mínima); lista de receitas com item exibindo valor formatado, badge de tipo (Salário/Outro), competência formatada (`"Mês/Ano"` quando não `null`), descrição; estado vazio com CTA "Cadastione sua primeira entrada"; estado de abertura do modal gerenciado localmente

- [X] T012 [US1] Criar `src/pages/entradas/index.ts` exportando `PaginaEntradas`

- [X] T013 [US1] Criar `src/features/receitas/index.ts` exportando `ModalReceita` de `./ui/ModalReceita`

- [X] T014 [US1] Criar `app/(app)/entradas/page.tsx`: Server Component que chama `obterContextoUsuario()` + `listarReceitas(contaFamiliaId)`; passa `receitas` e `papel` para `PaginaEntradas`; metadados `title: "Entradas | Financy"`

- [X] T015 [US1] Criar `app/(app)/entradas/loading.tsx` com esqueleto de carregamento compatível com o padrão de `app/(app)/cartoes/loading.tsx`

- [X] T016 [US1] Atualizar `src/widgets/navbar-rodape/ui/MenuAcoes.tsx`: mudar rota da opção "Nova entrada" de `"/entradas/nova"` para `"/entradas"`

**Checkpoint**: US1 completa — `/entradas` lista receitas; modal cria e fecha; footer navega para a tela.

---

## Phase 4: User Story 2 — Editar Receita (Priority: P2)

**Goal**: Membro aciona edição de uma receita existente → modal abre preenchido → altera campos (incluindo troca de tipo com limpeza de competência) → salva → lista atualizada.

**Independent Test**: Editar uma receita tipo Salário trocando tipo para Outro → competência some do registro; editar sem valor → erro inline; cancelar → nenhuma alteração persistida.

### Implementation for User Story 2

- [X] T017 [US2] Adicionar `editarReceita(entrada: EntradaFormulario): Promise<Resultado<{ id: string }>>` em `src/features/receitas/api/acoes.ts`: `obterContextoUsuario()` → `schemaEditarReceita.safeParse(lerFormData(entrada))`; se `tipo === "OUTRO"` forçar `competencia: null`; `clientePrisma.receita.updateMany({ where: { id, contaFamiliaId }, data: { valor, tipo, descricao, competencia } })`; `count === 0` → retornar `falha("NAO_ENCONTRADO", "Receita não encontrada.")`; `revalidatePath("/entradas")`; retornar `sucesso({ id })`

- [X] T018 [US2] Atualizar `src/features/receitas/ui/ModalReceita.tsx` para suportar `modo="editar"`: pré-preencher campos com `receita` quando modo for "editar" (`defaultValue` para valor formatado via `mascararValor`, tipo, descrição, competência); chamar `editarReceita` no envio quando `modo === "editar"`; mensagem de sucesso "Receita atualizada."; lógica de competência condicional (aparece/oculta + limpa) já deve funcionar — verificar que ao carregar edição de SALARIO o campo é exibido corretamente

- [X] T019 [US2] Adicionar trigger de edição em `src/pages/entradas/ui/PaginaEntradas.tsx`: cada item da lista expõe botão/ação "Editar" que passa a `receita` como prop para `ModalReceita modo="editar"`; estado de qual receita está em edição gerenciado localmente; `ModalReceita` é montado uma vez com state de `receitaEmEdicao` (null = fechado)

- [X] T020 [US2] Atualizar `src/features/receitas/index.ts` para exportar `editarReceita` de `./api/acoes` se necessário para uso externo

**Checkpoint**: US2 completa — edição abre com dados pré-preenchidos; troca de tipo limpa competência; salva e fecha.

---

## Phase 5: User Story 3 — Excluir Receita (Priority: P3)

**Goal**: ADMIN aciona exclusão de uma receita → confirmação aparece → confirma → receita removida da lista. Usuário não-ADMIN não vê o botão de excluir.

**Independent Test**: Autenticado como ADMIN, excluir receita → desaparece da lista; `SELECT COUNT(*) FROM incomes WHERE id = '<id>'` retorna 0; autenticado como USER → botão não visível.

### Implementation for User Story 3

- [X] T021 [US3] Adicionar `excluirReceita(entrada: EntradaFormulario): Promise<Resultado<{ id: string }>>` em `src/features/receitas/api/acoes.ts`: `obterContextoUsuario()` → `schemaIdReceita.safeParse(lerFormData(entrada))`; reler papel do banco: `clientePrisma.user.findUnique({ where: { id: usuarioId }, select: { role: true } })`; se `role !== "ADMIN"` retornar `falha("SEM_PERMISSAO", "Apenas administradores podem excluir receitas.")`; `clientePrisma.receita.deleteMany({ where: { id, contaFamiliaId } })`; `count === 0` → `falha("NAO_ENCONTRADO", "Receita não encontrada.")`; `revalidatePath("/entradas")`; retornar `sucesso({ id })`

- [X] T022 [US3] Criar `src/features/receitas/ui/BotaoExcluirReceita.tsx` como Client Component: props `{ id: string; descricao: string | null; valor: string }`; `window.confirm(\`Excluir esta entrada (${descricao ?? valor})? Esta ação não pode ser desfeita.\`)` antes de excluir; `useTransition` para loading; sucesso: `toast.success("Receita excluída.")`; erro: `toast.error(resultado.erro.mensagem)`; `aria-label={`Excluir entrada ${descricao ?? valor}`}`

- [X] T023 [US3] Integrar `BotaoExcluirReceita` em `src/pages/entradas/ui/PaginaEntradas.tsx`: renderizar somente quando `papel === "ADMIN"`; posicionar ao lado do trigger de edição em cada item da lista

- [X] T024 [US3] Atualizar `src/features/receitas/index.ts` para exportar `BotaoExcluirReceita` e `excluirReceita`

**Checkpoint**: US3 completa — exclusão com confirmação funciona para ADMIN; usuários comuns não veem o botão.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T025 [P] Executar `npm run lint` na raiz do projeto e corrigir todos os erros e warnings reportados

- [X] T026 [P] Executar `npm run build` e corrigir todos os erros de tipo TypeScript e de compilação

- [X] T027 Validar manualmente os cenários 1 a 9 do `specs/005-crud-receitas/quickstart.md`: cadastro salário, cadastro outro, validação de campos, edição com troca de tipo, edição de competência, exclusão ADMIN, exclusão bloqueada não-ADMIN, submissão dupla, erro de servidor

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependências — começar imediatamente
- **Phase 2 (Foundational)**: Depende de Phase 1 — **bloqueia todas as user stories**
- **Phase 3 (US1)**: Depende de Phase 2 — sem dependência de US2 ou US3
- **Phase 4 (US2)**: Depende de Phase 2 + Phase 3 (estende `ModalReceita` e `acoes.ts` criados em US1)
- **Phase 5 (US3)**: Depende de Phase 2 + Phase 3 (estende `acoes.ts` criado em US1)
- **Phase 6 (Polish)**: Depende de todas as user stories desejadas

### User Story Dependencies

- **US1 (P1)**: Pode iniciar após Phase 2 — não depende de US2 ou US3
- **US2 (P2)**: Pode iniciar após US1 (reaproveita `ModalReceita` e `acoes.ts`)
- **US3 (P3)**: Pode iniciar após US1 (reaproveita `acoes.ts`) — independente de US2

### Within Each Phase

- T002 (schema.prisma) → T003 (migration) — obrigatoriamente sequencial
- T004 e T005 (tipos e schemas) podem rodar em paralelo
- T009 (Server Action criar) → T010 (ModalReceita) → T011 (PaginaEntradas) — sequencial dentro de US1
- T014, T015, T016 podem rodar em paralelo entre si após T011

### Parallel Opportunities

- T004 [P] e T005 [P] — tipos.ts e schemas.ts em arquivos diferentes
- T009 e T006/T007/T008 — features e app route não se bloqueiam entre si
- T025 [P] e T026 [P] — lint e build são independentes

---

## Parallel Example: Phase 2

```bash
# T004 e T005 podem ser executados juntos após T002/T003:
Task T004: "Criar src/entities/receita/model/tipos.ts"
Task T005: "Criar src/entities/receita/model/schemas.ts"
```

## Parallel Example: User Story 1

```bash
# Após T011 (PaginaEntradas criada), T014/T015/T016 podem rodar juntos:
Task T014: "Criar app/(app)/entradas/page.tsx"
Task T015: "Criar app/(app)/entradas/loading.tsx"
Task T016: "Atualizar MenuAcoes rota Nova entrada"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup de diretórios
2. Phase 2: Foundational (migration + entidade) — **bloqueante**
3. Phase 3: US1 — cadastrar receita completo
4. **PARAR E VALIDAR**: Cenários 1, 2 e 3 do quickstart.md funcionando
5. Deploy/demo se aprovado

### Incremental Delivery

1. Setup + Foundational → entidade pronta, sem UI
2. US1 → `/entradas` com lista e modal de cadastro (MVP!)
3. US2 → edição inline na lista
4. US3 → exclusão para ADMIN
5. Cada story adiciona valor sem quebrar a anterior

---

## Notes

- `[P]` = arquivos diferentes, sem dependências incompletas
- `[Story]` mapeia cada tarefa à user story correspondente para rastreabilidade
- Sem tarefas de teste (excluídos do escopo da spec)
- Reutilizar `mascararValor`/`valorDaMascara` já disponíveis no projeto para o campo valor
- Reutilizar `paraDataBanco`, `inicioDaCompetencia`, `deDataBanco` de `shared/lib/datas`
- Reutilizar padrão de `BotaoExcluirCartao` para `BotaoExcluirReceita`
- Reutilizar padrão CSS de `OpcoesDespesa` para o `<dialog>` de `ModalReceita`
- Fazer commit após cada fase ou agrupamento lógico
- Parar em cada checkpoint para validar a story independentemente
