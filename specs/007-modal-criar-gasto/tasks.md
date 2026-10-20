---
description: "Task list — Modal de Criar Gasto"
---

# Tasks: Modal de Criar Gasto

**Input**: `specs/007-modal-criar-gasto/spec.md`

**Gerado em**: 2026-10-18

**Nota de contexto**: Não há `plan.md` para esta feature; tarefas derivadas diretamente da spec + análise do código existente. Stack: Next.js 16 App Router · React 19 · TypeScript strict · Tailwind v4 · Prisma 7 · PostgreSQL · Zod v4. Arquitetura FSD: `app → pages → widgets → features → entities → shared`.

## Formato: `[ID] [P?] [Story] Descrição`

- **[P]**: pode rodar em paralelo (arquivos distintos, sem dependências incompletas)
- **[Story]**: user story a que a tarefa pertence (US1–US4)
- Caminhos exatos incluídos nas descrições

---

## Phase 1: Setup (não aplicável — projeto existente)

Esta feature integra um projeto já inicializado. Nenhuma tarefa de scaffolding de projeto é necessária.

---

## Phase 2: Foundational (Pré-requisitos bloqueadores)

**Propósito**: Alterações de banco e entidades que DEVEM estar prontas antes de qualquer user story.

**⚠️ CRÍTICO**: Nenhuma user story pode começar antes que esta fase esteja completa.

- [ ] T001 Adicionar enum `FormaPagamento` (DINHEIRO, CARTAO) e model `Gasto` (id, nome, valor, formaPagamento, data, cartaoId? FK→CartaoCredito, contaFamiliaId FK→ContaFamilia, registradoPorId FK→User, criadoEm) em `prisma/schema.prisma`
- [ ] T002 Adicionar campo `limiteUtilizado Decimal @default(0) @db.Decimal(12,2)` ao model `CartaoCredito` em `prisma/schema.prisma`; adicionar relação `gastos GastoCartao[]` à `CartaoCredito` e `ContaFamilia`
- [ ] T003 Criar migration `npx prisma migrate dev --name add_gasto_and_limite_utilizado` e regenerar cliente Prisma (`npx prisma generate`)
- [ ] T004 [P] Criar tipos TypeScript para Gasto em `src/entities/gasto/model/tipos.ts`: `ResumoGasto` (id, nome, valor, formaPagamento, data, cartaoId), `DetalheGasto`
- [ ] T005 Criar schemas Zod em `src/entities/gasto/model/schemas.ts`: `schemaGasto` com nome (`.min(3, "O nome deve ter pelo menos 3 caracteres.").max(80)`), valor (positivo, Decimal-safe), formaPagamento (enum), data (default hoje), cartaoId (uuid opcional); exportar `type EntradaGasto`
- [ ] T006 [P] Criar consultas de DB em `src/entities/gasto/api/consultas.ts` (server-only): `listarGastos(contaFamiliaId)` — placeholder inicial mínimo para compilar
- [ ] T007 [P] Criar entry-point público `src/entities/gasto/index.ts` exportando tipos e schemas
- [ ] T008 [P] Criar entry-point server-only `src/entities/gasto/server.ts` exportando consultas
- [ ] T009 Atualizar `src/entities/despesa/api/saldo.ts` para incluir gastos no cálculo: subtrair `SUM(Gasto.valor WHERE contaFamiliaId AND data pertence à competência)` do saldo do mês

**Checkpoint**: Schema migrado, entidade `gasto` definida, saldo correto — user stories podem começar.

---

## Phase 3: User Story 1 — Registrar gasto com dinheiro (Priority: P1) 🎯 MVP

**Goal**: Usuário abre o modal, preenche nome/valor/data, seleciona "Dinheiro" e confirma; gasto é registrado e saldo da família reduzido.

**Independent Test**: Abrir o modal → preencher nome "Mercado", valor R$ 150,00, forma "Dinheiro", data padrão → confirmar → verificar que o gasto aparece na listagem e que `obterSaldoMes` retorna saldo reduzido em R$ 150,00.

### Implementação — US1

- [ ] T010 [US1] Criar Server Action `criarGasto` em `src/features/gastos/api/acoes.ts`: verificar sessão (`obterContextoUsuario`), validar entrada com `schemaGasto`, criar `Gasto` em transação Prisma, chamar `revalidatePath("/despesas")`, retornar `Resultado<{id:string}>`
- [ ] T011 [US1] Criar componente modal `ModalCriarGasto` em `src/features/gastos/ui/ModalCriarGasto.tsx` (`"use client"`): usa `<dialog>` nativo (padrão do projeto), campos nome/valor/formaPagamento (toggle Dinheiro|Cartão)/data; data default = hoje via `new Date().toISOString().split("T")[0]`; submit chama `criarGasto`; toast de sucesso e fechar modal ao concluir
- [ ] T012 [US1] Criar entry-point de feature `src/features/gastos/index.ts` exportando `ModalCriarGasto`
- [ ] T013 [US1] Integrar modal na tela de despesas: adicionar botão "Novo gasto" (ou "+" FAB) e `<ModalCriarGasto>` em `src/pages/despesas/ui/PaginaDespesas.tsx`; o botão deve ser Client Component mínimo (`BotaoNovoGasto`) que abre o modal via ref

**Checkpoint**: US1 funcional — modal abre, registra gasto com dinheiro, saldo atualizado na listagem.

---

## Phase 4: User Story 2 — Registrar gasto com cartão (Priority: P1)

**Goal**: Usuário seleciona "Cartão", escolhe cartão da lista, sistema valida limite e registra atomicamente com SELECT…FOR UPDATE.

**Independent Test**: Com cartão de limite R$ 500,00 (limiteUtilizado=0): tentar gasto de R$ 600,00 → bloqueado com mensagem de limite; registrar R$ 400,00 → `limiteUtilizado` = 400 e saldo família reduzido em 400.

### Implementação — US2

- [ ] T014 [P] [US2] Adicionar função `listarCartoesComLimiteDisponivel(contaFamiliaId)` em `src/entities/cartao/api/consultas.ts`: retorna id, nome, cor, limiteDisponivel = `limite - limiteUtilizado`
- [ ] T015 [P] [US2] Exportar `listarCartoesComLimiteDisponivel` em `src/entities/cartao/server.ts`
- [ ] T016 [US2] Criar componente `SeletorCartao` em `src/features/gastos/ui/SeletorCartao.tsx` (`"use client"`): recebe `cartoes: {id, nome, cor, limiteDisponivel}[]` como prop, renderiza lista de opções; exibe estado vazio "Nenhum cartão cadastrado. Crie um em Cartões." quando lista vazia
- [ ] T017 [US2] Estender `criarGasto` em `src/features/gastos/api/acoes.ts` para o caso CARTAO: usar `clientePrisma.$transaction` com `$queryRaw<CartaoCredito[]>\`SELECT * FROM credit_cards WHERE id = ${cartaoId} FOR UPDATE\`` para bloqueio pessimista, verificar `limite - limiteUtilizado >= valor` (retornar `falha("VALIDACAO", ...)` com limite disponível se exceder), criar `Gasto` e fazer `UPDATE credit_cards SET limite_utilizado = limite_utilizado + ${valor}` — tudo na mesma transação
- [ ] T018 [US2] Integrar `SeletorCartao` em `ModalCriarGasto` em `src/features/gastos/ui/ModalCriarGasto.tsx`: exibir seletor quando formaPagamento === "CARTAO"; carregar cartões como prop passada do servidor via `PaginaDespesas`
- [ ] T019 [US2] Atualizar `src/pages/despesas/ui/PaginaDespesas.tsx` para carregar cartões no servidor (`listarCartoesComLimiteDisponivel`) e passá-los como prop ao `ModalCriarGasto`

**Checkpoint**: US2 funcional — gasto com cartão registrado atomicamente, limite respeitado sob concorrência.

---

## Phase 5: User Story 3 — Validação de campos (Priority: P1)

**Goal**: Campos inválidos são destacados com foco automático; erros desaparecem ao corrigir; nada é persistido com dados inválidos.

**Independent Test**: Tentar confirmar com nome "Ab" → campo nome destacado (border-perigo, aria-invalid), foco automático, mensagem "O nome deve ter pelo menos 3 caracteres", nada salvo. Repetir para valor R$ 0,00 e cartão não selecionado.

### Implementação — US3

- [ ] T020 [P] [US3] Adicionar validação client-side com Zod em `ModalCriarGasto` (`src/features/gastos/ui/ModalCriarGasto.tsx`): antes de chamar a Server Action, validar com `schemaGasto.safeParse`; em caso de erro, mapear `fieldErrors` para estado `errosPorCampo`
- [ ] T021 [US3] Aplicar highlights de erro e foco automático em `ModalCriarGasto`: classes `border-perigo focus:ring-perigo` nos campos inválidos, `aria-invalid`, `aria-describedby` apontando para `<p id="campo-erro">`, e `element.focus()` no primeiro campo inválido — seguir padrão de `FormularioNovaDespesa.tsx`
- [ ] T022 [US3] Implementar limpeza de erro por campo ao editar em `ModalCriarGasto`: no handler `onInput` do formulário, limpar `errosPorCampo[name]` quando o usuário corrigir o campo inválido
- [ ] T023 [US3] Propagar erros de validação do servidor para campos em `ModalCriarGasto`: quando `criarGasto` retornar `falha("VALIDACAO")` ou `falha("LIMITE_EXCEDIDO")`, exibir mensagem no campo correspondente com foco automático

**Checkpoint**: US3 funcional — todos os casos de validação (nome curto, valor inválido, cartão não selecionado, limite excedido) comunicados corretamente sem persistência.

---

## Phase 6: User Story 4 — Cancelar sem salvar (Priority: P2)

**Goal**: Fechar o modal pelo botão Cancelar ou clique fora descarta tudo sem efeito colateral.

**Independent Test**: Abrir modal → preencher parcialmente → fechar → verificar que listagem e saldo permanecem inalterados.

### Implementação — US4

- [ ] T024 [US4] Implementar fechar por Cancelar e por backdrop em `ModalCriarGasto` (`src/features/gastos/ui/ModalCriarGasto.tsx`): botão Cancelar chama `dialogo.current?.close()`; handler `onClick` no `<dialog>` fecha quando `evento.target === evento.currentTarget` — padrão de `OpcoesDespesa.tsx`
- [ ] T025 [US4] Resetar estado do formulário ao fechar em `ModalCriarGasto`: no evento `close` do `<dialog>`, resetar campos, limpar erros e redefinir formaPagamento para "DINHEIRO"; garantir que reabrir o modal exibe campos em branco

**Checkpoint**: US4 funcional — fechar sem salvar não altera nenhum dado.

---

## Phase 7: Polish & Preocupações Transversais

**Propósito**: Qualidade, acessibilidade e verificações finais que afetam múltiplas stories.

- [ ] T026 [P] Verificar acessibilidade de `ModalCriarGasto`: `aria-labelledby` no `<dialog>`, rótulos visíveis em todos os campos, navegação por teclado (Tab/Shift+Tab dentro do modal), Escape fecha o modal (comportamento nativo do `<dialog>`)
- [ ] T027 [P] Verificar que `limiteDisponivel` é recalculado corretamente (= `limite - limiteUtilizado`) na query `listarCartoesComLimiteDisponivel` em `src/entities/cartao/api/consultas.ts` — nenhum ponto flutuante, usar aritmética Prisma Decimal
- [ ] T028 Executar `npm run lint && npm run build` sem erros; corrigir quaisquer violações de TypeScript strict ou ESLint antes de considerar a feature pronta

---

## Dependências e Ordem de Execução

### Dependências entre fases

- **Foundational (Phase 2)**: sem dependências — pode começar imediatamente
- **US1, US2, US3, US4 (Phases 3–6)**: todas dependem do término da Phase 2
- **US1 (Phase 3)**: deve ser concluída antes de US2 (Phase 4) — US2 estende `criarGasto` e `ModalCriarGasto`
- **US3 (Phase 5)**: pode ser parcialmente trabalhada junto com US1 (mesmos arquivos — atenção a conflitos)
- **US4 (Phase 6)**: independente de US2/US3; pode começar após US1
- **Polish (Phase 7)**: depende de todas as stories

### Dependências entre user stories

- **US1 (P1)**: pode começar após Foundational — sem dependência de outras stories
- **US2 (P1)**: depende de US1 concluída (estende `criarGasto` e `ModalCriarGasto`)
- **US3 (P1)**: pode começar após US1; modificações nos mesmos arquivos de US2 — coordenar
- **US4 (P2)**: pode começar após US1 — não depende de US2 ou US3

### Dentro de cada user story

- Entidade → Server Action → Componente UI → Integração de página
- Nenhum dado de formulário deve chegar ao banco sem passar por Zod no servidor

### Oportunidades de paralelismo

- T004, T006, T007, T008 (Foundational) — podem rodar em paralelo após T003
- T014, T015 (US2) — podem rodar em paralelo enquanto T011 (US1 modal) está em andamento
- T020, T026, T027 — podem rodar em paralelo

---

## Exemplo de execução paralela — Foundational

```
# Após T003 (migration concluída), lançar em paralelo:
T004: src/entities/gasto/model/tipos.ts
T006: src/entities/gasto/api/consultas.ts
T007: src/entities/gasto/index.ts
T008: src/entities/gasto/server.ts
```

## Exemplo de execução paralela — US2

```
# Após T013 (US1 checkpoint), lançar em paralelo:
T014: src/entities/cartao/api/consultas.ts  (listarCartoesComLimiteDisponivel)
T015: src/entities/cartao/server.ts         (exportar nova função)
T016: src/features/gastos/ui/SeletorCartao.tsx
# Depois, em sequência:
T017: src/features/gastos/api/acoes.ts      (estender criarGasto)
T018: src/features/gastos/ui/ModalCriarGasto.tsx  (integrar SeletorCartao)
T019: src/pages/despesas/ui/PaginaDespesas.tsx
```

---

## Estratégia de implementação

### MVP (apenas US1)

1. Concluir Phase 2: Foundational (T001–T009)
2. Concluir Phase 3: US1 (T010–T013)
3. **PARAR E VALIDAR**: testar modal com gasto em dinheiro de ponta a ponta
4. Deploy/demo se aprovado

### Entrega incremental

1. Foundational → Foundation pronta
2. + US1 → Modal básico funcional → Demo (MVP!)
3. + US2 → Gasto com cartão + controle de limite → Demo
4. + US3/US4 → Validação completa + cancelamento seguro → Feature pronta
5. Polish → Qualidade final

---

## Notas

- `[P]` = arquivo diferente de outros em andamento, sem dependências incompletas
- `[USn]` = mapeia a tarefa para rastreabilidade com a spec
- Valores monetários: **sempre** `Decimal` — aritmética de ponto flutuante é proibida pela constituição
- `usuarioId` e `contaFamiliaId` **sempre** obtidos no servidor via `obterContextoUsuario()` — nunca recebidos do cliente (FR-015)
- Bloqueio pessimista via `$queryRaw\`SELECT ... FOR UPDATE\`` dentro de `$transaction` — Prisma não tem suporte nativo a row-level lock (FR-012)
- Padrão de modal do projeto: `<dialog>` nativo, fecha ao clicar no backdrop (verificar `evento.target === evento.currentTarget`) — seguir `OpcoesDespesa.tsx`
- Padrão de validação + foco: seguir `FormularioNovaDespesa.tsx` (estado `errosPorCampo`, `exibirErros`, `limparErro`)
