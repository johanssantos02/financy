---
description: "Task list — Tags em Gastos"
---

# Tasks: Tags em Gastos

**Input**: `specs/009-tags-gastos/spec.md` · `plan.md` · `data-model.md` · `contracts/api-tags-gastos.md`

**Gerado em**: 2026-10-19

**Contexto**: Feature incremental sobre CRUD de gastos existente. Stack: Next.js 16 App Router · React 19 · TypeScript strict · Tailwind v4 · Prisma 7 · PostgreSQL · Zod v4. Arquitetura FSD: `app → pages → widgets → features → entities → shared`. Não há test runner unitário — validação via `npm run lint && npm run build`.

## Formato: `[ID] [P?] [Story] Descrição`

- **[P]**: pode rodar em paralelo (arquivos distintos, sem dependências incompletas)
- **[Story]**: user story a que a tarefa pertence — US1 (criar com tag), US2 (editar tag), US3 (histórico/dashboard)
- Caminhos exatos incluídos nas descrições

---

## Phase 1: Setup (Schema e Migration)

**Propósito**: Alterações de banco de dados que DEVEM estar prontas antes de qualquer implementação.

**⚠️ CRÍTICO**: Nenhuma fase posterior pode começar antes desta estar completa.

- [X] T001 Alterar `prisma/schema.prisma`: (a) adicionar `enum TipoTag { GASTOS @map("spending") DESPESAS @map("expense") @@map("tag_types") }`; (b) adicionar campo `tipo TipoTag @map("type")` ao model `Tag`; (c) alterar `@@unique` de Tag de `[contaFamiliaId, nomeNormalizado]` para `[contaFamiliaId, nomeNormalizado, tipo]`; (d) adicionar relação `gastos Gasto[]` a Tag; (e) adicionar campos `tag Tag? @relation(fields: [tagId], references: [id], onDelete: SetNull)` e `tagId String? @map("tag_id") @db.Uuid` ao model `Gasto`
- [ ] T002 Gerar migration `npx prisma migrate dev --name tags_gastos` e regenerar cliente (`npx prisma generate`); confirmar que o SQL gerado inclui: CREATE TYPE "tag_types", ALTER TABLE "tags" ADD COLUMN "type" com DEFAULT 'expense', DROP e recriação da constraint unique, ALTER TABLE "spendings" ADD COLUMN "tag_id" com FK onDelete SET NULL

**Checkpoint**: Schema migrado, cliente regenerado — fases seguintes podem começar.

---

## Phase 2: Fundacional (Entidade Tag e Extensões de Gasto)

**Propósito**: Criar a entidade `tag` e estender a entidade `gasto` com os novos campos. DEVE estar completo antes das user stories.

**⚠️ CRÍTICO**: Nenhuma user story pode começar antes desta fase estar completa.

- [X] T003 [P] Criar `src/entities/tag/model/tipos.ts`: exportar `type ResumoTag = { id: string; nome: string }`
- [X] T004 [P] Criar `src/entities/tag/api/consultas.ts` (server-only): implementar `listarTagsPorTipo(contaFamiliaId: string, tipo: TipoTag): Promise<ResumoTag[]>` — SELECT id, nome FROM tags WHERE contaFamiliaId = ? AND tipo = ? ORDER BY nome ASC
- [X] T005 Criar `src/entities/tag/index.ts` exportando `ResumoTag`; criar `src/entities/tag/server.ts` exportando `listarTagsPorTipo` (re-export de `./api/consultas`)
- [X] T006 [P] Alterar `src/entities/gasto/model/tipos.ts`: adicionar campos `tagId: string | null` e `tagNome: string | null` a `ResumoGasto`; adicionar campo `tagNome: string | null` a `TransacaoUnificada`
- [X] T007 [P] Alterar `src/entities/gasto/model/schemas.ts`: adicionar campo `tagId: z.uuid("Tag inválida.").nullish().transform((v) => v ?? null)` ao `schemaGasto`; o schema não valida tipo da tag (responsabilidade da Server Action)
- [X] T008 [P] Alterar `listarGastosPorContaEMes` em `src/entities/gasto/api/consultas.ts`: adicionar `include: { tag: { select: { nome: true } } }` à query Prisma; mapear `gasto.tag?.nome ?? null` para o campo `tagNome` do `ResumoGasto` retornado
- [X] T009 Alterar `prisma/seed.ts`: iterar sobre todas as `ContaFamilia` existentes e fazer `upsert` das 5 tags tipo GASTOS por conta (lazer/lazer, gasolina/gasolina, saúde/saude, alimentação/alimentacao, outros/outros); executar `npx prisma db seed` e confirmar que cada conta tem as 5 tags com `tipo = "GASTOS"`

**Checkpoint**: Entidade `tag` criada, tipos de `gasto` estendidos, seed aplicado — user stories podem começar.

---

## Phase 3: User Story 1 — Criar gasto com tag (Priority: P1) 🎯 MVP

**Goal**: Usuário abre o modal de criar gasto, seleciona (ou não) uma tag da lista de categorias GASTOS, confirma e o gasto é registrado com a tag associada; a categoria aparece no badge na listagem.

**Independent Test**: Abrir modal → selecionar "Gasolina" → preencher demais campos → confirmar → verificar badge "Gasolina" na listagem sem recarregamento; repetir sem tag → verificar que gasto aparece sem badge e sem erro (quickstart cenários 1–3 e 6).

### Implementação — US1

- [X] T010 [US1] Criar Server Action `buscarTagsGasto(): Promise<Resultado<ResumoTag[]>>` em `src/features/gastos/api/acoes.ts`: verificar sessão com `obterContextoUsuario`, chamar `listarTagsPorTipo(contaFamiliaId, "GASTOS")`, retornar `{ sucesso: true; dados: ResumoTag[] }` ou `{ sucesso: false; erro: { tipo: "NAO_AUTENTICADO" } }`; ordenação por nome ASC delegada à query
- [X] T011 [P] [US1] Criar `src/features/gastos/ui/SeletorTag.tsx` (`"use client"`): props `{ tags: ResumoTag[]; valorInicial?: string | null; comErro?: boolean; idAcessibilidade?: string; descricaoAcessibilidade?: string }`; quando `tags.length > 0` renderizar `<select name="tagId">` com opção vazia `value=""` ("Sem categoria") + uma `<option value={id}>{nome}</option>` por tag; quando `tags.length === 0` renderizar `<p>` informativo em vez do select; campo não-obrigatório: sem validação front-end
- [X] T012 [US1] Alterar `criarGasto` em `src/features/gastos/api/acoes.ts`: ler `tagId` do FormData; pós-validação Zod, se `tagId` presente executar query `findFirst({ where: { id: tagId, contaFamiliaId, tipo: "GASTOS" } })` — se não encontrada retornar `falha("VALIDACAO", "Tag inválida.", { tagId: ["Tag não encontrada ou inválida."] })`; incluir `tagId: dados.tagId ?? null` no `data` do `prisma.gasto.create`
- [ ] T013 [P] [US1] Alterar `src/pages/despesas/ui/PaginaDespesas.tsx` (Server Component): chamar `buscarTagsGasto()` no servidor e passar `tags={resultado.dados ?? []}` como prop a `ModalCriarGasto`
- [X] T014 [US1] Alterar `src/features/gastos/ui/ModalCriarGasto.tsx`: aceitar prop `tags: ResumoTag[]`; adicionar campo "Categoria" com `<SeletorTag tags={tags} idAcessibilidade="gasto-tagId">` dentro do formulário; propagar `errosPorCampo.tagId` ao seletor via prop `comErro`; limpar erro do campo ao alterar seleção
- [ ] T015 [P] [US1] Alterar `src/widgets/lista-despesas/ui/ListaDespesas.tsx`: nos itens de gasto exibir `<span className="text-xs font-medium text-texto-sec bg-fundo-sec px-2 py-0.5 rounded-full">{tagNome}</span>` quando `tagNome !== null`; quando `tagNome === null` não renderizar nenhum elemento (sem espaço reservado, conforme FR-007)

**Checkpoint**: US1 funcional — modal exibe seletor de categoria, cria gasto com ou sem tag, badge aparece na listagem imediatamente.

---

## Phase 4: User Story 2 — Editar tag de gasto existente (Priority: P2)

**Goal**: Usuário acessa a tela de edição de um gasto existente, vê a tag atual pré-selecionada, pode alterar ou remover, e ao salvar o histórico reflete imediatamente a mudança.

**Independent Test**: Registrar gasto com tag "Lazer" → navegar para `/gastos/<id>` → confirmar que "Lazer" está pré-selecionado → alterar para "Alimentação" → salvar → verificar badge "Alimentação" no dashboard; repetir removendo tag (selecionar "Sem categoria") → verificar gasto sem badge (quickstart cenários 4 e 5).

### Implementação — US2

- [ ] T016 [US2] Criar/completar `buscarGastoPorId(id: string, contaFamiliaId: string)` em `src/entities/gasto/api/consultas.ts`: query `findFirst({ where: { id, contaFamiliaId }, include: { tag: { select: { id: true, nome: true } }, cartao: { select: { id: true, nome: true } } } })`; retornar null se não encontrado; mapear para tipo incluindo `tagId: gasto.tagId` e `tagNome: gasto.tag?.nome ?? null`
- [ ] T017 [US2] Criar/completar `editarGasto` em `src/features/gastos/api/acoes.ts`: campos no FormData: `id` (uuid, obrigatório), `nome` (3–80 chars), `valor` (> 0, Decimal-safe), `data` (YYYY-MM-DD), `formaPagamento` (DINHEIRO|CARTAO), `cartaoId` (uuid, obrigatório se CARTAO), `tagId` (uuid, opcional); verificar que `id` pertence à `contaFamiliaId` da sessão; mesma validação pós-Zod de tagId tipo GASTOS de `criarGasto`; executar `prisma.gasto.update`; chamar `revalidatePath("/dashboard")` e `revalidatePath("/despesas")`
- [ ] T018 [US2] Alterar `src/pages/editar-gasto/ui/PaginaEditarGasto.tsx`: buscar gasto com `buscarGastoPorId` (incluindo tagId/tagNome) + buscar tags com `buscarTagsGasto` no servidor em paralelo (`Promise.all`); redirecionar para `/dashboard` se gasto não encontrado; incluir `<SeletorTag tags={tags} valorInicial={gasto.tagId}>` no formulário com a tag atual pré-selecionada; conectar submit a `editarGasto`

**Checkpoint**: US2 funcional — tela de edição exibe tag atual, aceita alteração ou remoção, persiste e reflete imediatamente.

---

## Phase 5: User Story 3 — Visualizar tags no histórico e dashboard (Priority: P2)

**Goal**: Tags aparecem como badges no histórico de transações e na listagem do dashboard para todos os gastos que têm tag, de forma consistente entre gastos com dinheiro e cartão.

**Independent Test**: Registrar três gastos com tags diferentes + dois sem tag → abrir histórico → verificar que cada gasto exibe sua tag corretamente e os sem tag não têm rótulo nem espaço vazio (quickstart cenário de validação de exibição; spec US3 cenários 1–3).

### Implementação — US3

- [ ] T019 [US3] Alterar `listarTransacoesUnificadas` em `src/entities/gasto/api/consultas.ts`: na query `$queryRaw` (UNION), adicionar `LEFT JOIN "tags" ON "tags"."id" = "spendings"."tag_id"` ao bloco de gastos; adicionar colunas `"spendings"."tag_id" AS tag_id, "tags"."name" AS tag_name` ao SELECT; para o bloco de despesas, adicionar `NULL AS tag_id, NULL AS tag_name`; mapear `tag_id`/`tag_name` para `tagId`/`tagNome` no tipo `TransacaoUnificada`
- [ ] T020 [P] [US3] Alterar `src/widgets/historico-transacoes/ui/HistoricoTransacoes.tsx`: nos itens de gasto (`tipo === "GASTO"`) exibir badge `<span className="text-xs font-medium text-texto-sec bg-fundo-sec px-2 py-0.5 rounded-full">{tagNome}</span>` quando `tagNome !== null`; nenhum rótulo quando `tagNome === null`; comportamento visual idêntico entre gastos com dinheiro e cartão (FR-007, spec US3 AC-3)
- [ ] T021 [P] [US3] Verificar `src/pages/dashboard/ui/PaginaDashboard.tsx` (ou widget de listagem de gastos do dashboard): confirmar que a query de gastos do dashboard inclui `tagNome` (já coberto por T008 se usa `listarGastosPorContaEMes`); confirmar que o badge de tag é exibido com o mesmo padrão visual de `ListaDespesas` (FR-008); nenhuma alteração necessária se a integração já existir — documentar o resultado

**Checkpoint**: US3 funcional — tags visíveis no histórico e dashboard para todos os gastos com categoria atribuída.

---

## Phase 6: Polish e Preocupações Transversais

**Propósito**: Qualidade, acessibilidade, edge cases e verificação final afetando múltiplas stories.

- [ ] T022 [P] Verificar acessibilidade de `SeletorTag` em `src/features/gastos/ui/SeletorTag.tsx`: confirmar `<label htmlFor="gasto-tagId">Categoria</label>` associado; atributo `aria-describedby` apontando para `<p id="gasto-tagId-erro" role="alert">` quando `comErro=true`; `aria-invalid="true"` no select com erro; navegação por teclado funcional; label visível (não apenas aria-label)
- [ ] T023 [P] Verificar edge cases nas Server Actions em `src/features/gastos/api/acoes.ts`: confirmar que enviar `tagId` de tag com `tipo = DESPESAS` retorna `falha("VALIDACAO", ..., { tagId: ["Tag não encontrada ou inválida."] })`; confirmar que seletor vazio (sem tags do tipo GASTOS na conta) renderiza `<p>` informativo e o gasto pode ser salvo sem tag — testar os cenários descritos em `spec.md` Edge Cases
- [ ] T024 Executar `npm run lint && npm run build` sem erros: corrigir violações TypeScript strict (especialmente `string | null` vs `string | undefined` nos novos campos, e imports de `TipoTag` do client Prisma); confirmar que nenhuma regressão foi introduzida nos fluxos existentes de criação de gastos (SC-004)

---

## Dependências e Ordem de Execução

### Dependências entre fases

- **Phase 1 (Setup)**: sem dependências — pode começar imediatamente
- **Phase 2 (Fundacional)**: depende de Phase 1 completa (schema migrado)
- **US1 (Phase 3)**: depende de Phase 2 completa — T011 e T013 podem rodar em paralelo; T014 depende de T011 e T012
- **US2 (Phase 4)**: depende de Phase 2 completa; T016 pode rodar em paralelo com US1; T017/T018 dependem de T016
- **US3 (Phase 5)**: depende de Phase 2 completa; T019 pode rodar em paralelo com US1/US2; T020/T021 dependem de T019
- **Polish (Phase 6)**: depende de todas as stories concluídas

### Dependências entre user stories

- **US1 (P1)**: pode começar após Foundational — sem dependência de outras stories
- **US2 (P2)**: pode começar após Foundational; T016 é independente de US1; T018 usa `SeletorTag` de US1 (T011 deve estar pronto)
- **US3 (P2)**: pode começar após Foundational; T019 é independente de US1/US2

### Dentro de cada user story

- Query/consulta → Server Action → Componente UI → Integração de página
- `tagId`/`contaFamiliaId` **sempre** obtidos no servidor via `obterContextoUsuario()` — nunca recebidos do cliente (FR-011)

### Oportunidades de paralelismo

- **Após T002 (migration)**: T003, T004, T006, T007, T008 podem rodar em paralelo
- **Após Phase 2**: T010, T011, T013 (US1) e T016 (US2) e T019 (US3) podem rodar em paralelo
- **T014 (ModalCriarGasto)**: espera T011 (SeletorTag) + T012 (criarGasto com tagId)
- **T022, T023**: podem rodar em paralelo após todas as stories

---

## Exemplo de execução paralela — Fundacional (após T002)

```
# Após migration concluída, lançar em paralelo:
T003: src/entities/tag/model/tipos.ts
T004: src/entities/tag/api/consultas.ts
T006: src/entities/gasto/model/tipos.ts
T007: src/entities/gasto/model/schemas.ts
T008: src/entities/gasto/api/consultas.ts
# Em sequência após T003+T004:
T005: src/entities/tag/index.ts + server.ts
T009: prisma/seed.ts
```

## Exemplo de execução paralela — US1 + US2 + US3 (após Phase 2)

```
# Lançar em paralelo após Phase 2:
T010: buscarTagsGasto em acoes.ts
T011: SeletorTag.tsx
T013: PaginaDespesas.tsx (passa tags ao modal)
T016: buscarGastoPorId em consultas.ts
T019: listarTransacoesUnificadas LEFT JOIN

# Após T010+T011+T012:
T014: ModalCriarGasto.tsx (integra SeletorTag)

# Após T016:
T017: editarGasto em acoes.ts
# Após T011+T017:
T018: PaginaEditarGasto.tsx

# Após T019:
T020: HistoricoTransacoes.tsx
T021: PaginaDashboard.tsx
```

---

## Estratégia de implementação

### MVP (apenas US1)

1. Concluir Phase 1: Setup (T001–T002)
2. Concluir Phase 2: Fundacional (T003–T009)
3. Concluir Phase 3: US1 (T010–T015)
4. **PARAR E VALIDAR**: executar quickstart cenários 1–3 e 6 manualmente
5. Deploy/demo se aprovado

### Entrega incremental

1. Phase 1 + Phase 2 → banco e entidades prontos
2. + US1 → modal com tag funcional → Demo (MVP!)
3. + US2 → edição de tag disponível
4. + US3 → histórico e dashboard com badges de tag → Feature completa
5. Polish → qualidade final

---

## Notas

- `[P]` = arquivo diferente de outros em andamento, sem dependências incompletas
- `[USn]` = rastreabilidade com a spec
- **Nunca** passar `contaFamiliaId` pelo cliente — sempre obtido via `obterContextoUsuario()` no servidor (FR-011, Princípio IV)
- **Validação de tipo GASTOS**: feita no servidor (Server Action), não no Zod — a query de seed e a Server Action são as únicas fronteiras (Decisão 6 em `research.md`)
- **Tags por conta família**: manter `contaFamiliaId` em Tag — não remover; seed por conta via `prisma/seed.ts` (Decisão 5 em `research.md`)
- **`onDelete: SetNull`**: FK `tag_id` vira NULL ao deletar tag — gastos preservados (FR-010, Decisão 4)
- **Constraint unique alterada**: `(contaFamiliaId, nomeNormalizado, tipo)` — permite mesmo nome em tipos diferentes (Decisão 3)
- **Badge HTML padrão**: `<span className="text-xs font-medium text-texto-sec bg-fundo-sec px-2 py-0.5 rounded-full">` conforme contratos
- **Histórico unificado**: usa `$queryRaw` (UNION) — adicionar LEFT JOIN no bloco de gastos sem afetar bloco de despesas (Decisão 7)
