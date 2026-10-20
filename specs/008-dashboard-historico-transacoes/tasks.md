# Tasks: Dashboard — Histórico de Transações

**Input**: Design documents from `/specs/008-dashboard-historico-transacoes/`

**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/TransacaoUnificada.ts ✅

**Tests**: Não solicitados na spec — apenas `npm run lint` + `npm run build` como gate obrigatório.

**Organização**: Tarefas agrupadas por user story para permitir implementação e validação independente de cada história.

## Format: `[ID] [P?] [Story] Descrição`

- **[P]**: pode rodar em paralelo (arquivos distintos, sem dependência de tarefa incompleta)
- **[Story]**: user story à qual a tarefa pertence (US1–US5)
- Caminhos de arquivo exatos em todas as descrições

---

## Phase 1: Setup (Estrutura dos novos módulos FSD)

**Propósito**: Criar os diretórios e arquivos de entrada (`index.ts`) dos módulos novos antes de qualquer implementação.

- [ ] T001 Criar estrutura de diretórios dos novos módulos FSD: `src/entities/gasto/`, `src/entities/gasto/model/`, `src/entities/gasto/api/`, `src/features/gastos/api/`, `src/widgets/historico-transacoes/ui/`, `src/pages/dashboard/ui/`, `src/pages/editar-gasto/ui/`

---

## Phase 2: Fundacional (Bloqueante para todas as user stories)

**Propósito**: Tipos, schemas e queries que TODAS as user stories dependem. Nenhuma US pode começar antes desta fase.

**⚠️ CRÍTICO**: Toda US depende das queries e tipos aqui definidos.

- [ ] T002 [P] Adicionar tipos `TipoTransacao = "GASTO_DINHEIRO" | "GASTO_CARTAO" | "DESPESA_PAGA"`, `TransacaoUnificada` (id, nome, valor: string, tipo, criadoEm: string ISO-8601, editavel: boolean) e `FiltrosHistorico` (busca: string, pagina: number 1-indexed, limite: number) e `ResultadoHistorico` (transacoes, totalItens, totalPaginas, paginaAtual) em `src/entities/gasto/model/tipos.ts`
- [ ] T003 [P] Adicionar `schemaFiltrosHistorico` em `src/entities/gasto/model/schemas.ts`: `z.object({ busca: z.string().default(""), pagina: z.coerce.number().int().min(1).default(1), limite: z.coerce.number().int().min(1).max(100).default(20) })`
- [ ] T004 Implementar `listarTransacoesUnificadas(contaFamiliaId: string, filtros: FiltrosHistorico): Promise<TransacaoUnificada[]>` em `src/entities/gasto/api/consultas.ts` usando `clientePrisma.$queryRaw` com SQL UNION ALL: branch `spendings` (GASTO_DINHEIRO quando `payment_method = 'cash'`, GASTO_CARTAO quando `payment_method = 'card'`, `editavel = (payment_method = 'cash')`) UNION ALL branch `expense_payments JOIN expenses` (DESPESA_PAGA, `editavel = false`, nome e valor de `expenses`, ordenação por `paid_at`); filtro `ILIKE $2` em ambos os branches; `ORDER BY created_at DESC LIMIT $3 OFFSET $4`; `contaFamiliaId` sempre de parâmetro, nunca do cliente; valores `Decimal` serializados como `string`
- [ ] T005 Implementar `contarTransacoesUnificadas(contaFamiliaId: string, filtros: Pick<FiltrosHistorico, "busca">): Promise<number>` em `src/entities/gasto/api/consultas.ts` via `Promise.all` com duas queries `COUNT(*)::int`: query A em `spendings WHERE family_account_id = $1 AND name ILIKE $2`; query B em `expense_payments JOIN expenses WHERE d.family_account_id = $1 AND d.name ILIKE $2 AND d.deleted_at IS NULL`; retorna soma dos dois totais
- [ ] T006 Re-exportar `listarTransacoesUnificadas` e `contarTransacoesUnificadas` em `src/entities/gasto/server.ts`; re-exportar `TipoTransacao`, `TransacaoUnificada`, `FiltrosHistorico`, `ResultadoHistorico`, `schemaFiltrosHistorico` em `src/entities/gasto/index.ts`

**Checkpoint**: Tipos e queries prontas — implementação das US pode começar.

---

## Phase 3: User Story 1 — Consultar saldo e panorama financeiro do mês (Priority: P1) 🎯 MVP

**Goal**: O usuário abre `/dashboard` e vê o saldo do mês atual no topo, com indicação visual clara (positivo, negativo ou zero).

**Independent Test**: Abrir `/dashboard` sem interação. Verificar que o saldo do mês atual aparece no topo em < 2s, formatado em R$, com cor verde para positivo, vermelho para negativo e neutro para zero.

- [ ] T007 [P] [US1] Criar `EsqueletoHistorico` em `src/widgets/historico-transacoes/ui/EsqueletoHistorico.tsx` — Server Component com placeholder animado (Tailwind `animate-pulse`) para saldo e lista de itens; usado no `<Suspense fallback>` da página
- [ ] T008 [US1] Criar `PaginaDashboard` em `src/pages/dashboard/ui/PaginaDashboard.tsx` — Server Component que: chama `obterContextoUsuario()` para obter `contaFamiliaId`; chama `obterSaldoMes(contaFamiliaId, competenciaAtual())` de `src/entities/despesa/api/saldo.ts`; exibe o saldo formatado em R$ no topo (sticky durante scroll — `position: sticky top-0`); aplica cor verde quando saldo > 0, vermelho quando < 0, neutro quando = 0; mostra mês de competência por extenso; recebe `searchParams` como prop (repassados à lista)
- [ ] T009 [P] [US1] Criar `src/pages/dashboard/index.ts` exportando `PaginaDashboard`
- [ ] T010 [US1] Substituir o placeholder em `app/(app)/dashboard/page.tsx` por `PaginaDashboard`, wrapping da seção de lista em `<Suspense fallback={<EsqueletoHistorico />}>`; receber `searchParams: Promise<SearchParams>` conforme convenção Next.js 16 App Router

**Checkpoint**: `/dashboard` exibe saldo correto do mês. US1 testável de forma independente.

---

## Phase 4: User Story 2 — Visualizar histórico unificado de todas as transações (Priority: P1)

**Goal**: Lista unificada com os três tipos de transação (GASTO_DINHEIRO, GASTO_CARTAO, DESPESA_PAGA), ordenada do mais recente para o mais antigo, com estado vazio amigável.

**Independent Test**: Com ao menos um item de cada tipo cadastrado, abrir `/dashboard` e verificar que os três aparecem na mesma lista com badge de tipo, na ordem correta; sem a busca ou paginação ainda (usa defaults).

- [ ] T011 [US2] Implementar `ListaHistoricoTransacoes` em `src/widgets/historico-transacoes/ui/ListaHistoricoTransacoes.tsx` — Server Component que: recebe `contaFamiliaId: string` e `filtros: FiltrosHistorico` como props; chama `listarTransacoesUnificadas` e `contarTransacoesUnificadas` em `Promise.all`; renderiza lista de `ItemTransacao`; exibe estado vazio (`"Nenhuma transação registrada. Registre seu primeiro gasto!"`) quando `transacoes.length === 0`; calcula `totalPaginas = Math.ceil(totalItens / filtros.limite)`
- [ ] T012 [US2] Implementar `ItemTransacao` em `src/widgets/historico-transacoes/ui/ItemTransacao.tsx` — `"use client"` — recebe `transacao: TransacaoUnificada`; exibe nome, valor formatado (R$), data localizada (pt-BR) e badge visual de tipo (`GASTO_DINHEIRO` = ícone carteira/dinheiro, `GASTO_CARTAO` = ícone cartão, `DESPESA_PAGA` = ícone recibo); sem drag-to-reveal nesta fase
- [ ] T013 [P] [US2] Criar `src/widgets/historico-transacoes/index.ts` exportando `ListaHistoricoTransacoes`
- [ ] T014 [US2] Atualizar `PaginaDashboard` em `src/pages/dashboard/ui/PaginaDashboard.tsx` para incluir `<ListaHistoricoTransacoes contaFamiliaId={contaFamiliaId} filtros={filtrosPadrao} />` dentro do `Suspense`; usar `schemaFiltrosHistorico.parse({})` como filtros padrão inicialmente

**Checkpoint**: Lista unificada visível em `/dashboard` com os três tipos. US2 testável de forma independente.

---

## Phase 5: User Story 3 — Editar ou excluir um gasto em dinheiro (Priority: P1)

**Goal**: Deslizar um item `GASTO_DINHEIRO` para a esquerda revela "Editar" e "Excluir". Excluir exige confirmação. Editar navega para `/gastos/[id]/editar`. Itens GASTO_CARTAO e DESPESA_PAGA são imóveis.

**Independent Test**: Com um `GASTO_DINHEIRO` na lista, deslizar > 80px e verificar que os botões aparecem. Excluir, confirmar e verificar que o item desaparece e o saldo é atualizado. Tentar deslizar um `GASTO_CARTAO` e confirmar que não reage.

- [ ] T015 [US3] Implementar `excluirGasto` Server Action em `src/features/gastos/api/acoes.ts`: validar sessão com `obterContextoUsuario()`; validar input `{ id: string }` com Zod; executar `clientePrisma.gasto.delete({ where: { id, contaFamiliaId } })` (filtro duplo contra deleção cross-tenant — IV-003); lançar erro `"OPERACAO_INVALIDA"` se gasto for `formaPagamento = CARTAO`; chamar `revalidatePath('/dashboard')` após exclusão bem-sucedida; retornar `ExcluirGastoOutput` discriminado
- [ ] T016 [US3] Atualizar `ItemTransacao` em `src/widgets/historico-transacoes/ui/ItemTransacao.tsx` com drag-to-reveal: adicionar handlers `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel` apenas quando `transacao.editavel === true`; capturar `startX` e `setPointerCapture` no `onPointerDown`; calcular `deltaX` no `onPointerMove`, aplicar `transform: translateX(Math.max(deltaX, -ACTION_WIDTH)px)` sem `transition` durante arraste; no `onPointerUp`, se `|deltaX| >= 80` fixar em `-ACTION_WIDTH` (revelar ações), caso contrário resetar para 0 com `transition: transform 200ms`; `onPointerCancel` sempre reseta; `ACTION_WIDTH` = largura dos botões de ação revelados; itens com `editavel === false` não registram nenhum handler
- [ ] T017 [US3] Criar `DialogoConfirmarExclusao` em `src/widgets/historico-transacoes/ui/DialogoConfirmarExclusao.tsx` — `"use client"` — recebe `gasto: Pick<TransacaoUnificada, "id" | "nome" | "valor">`, `aberto: boolean`, `onCancelar: () => void`, `onConfirmar: () => void`; exibe nome e valor do gasto; ao confirmar chama `excluirGasto({ id })` e invoca `onConfirmar()`; integrar em `ItemTransacao` para o botão Excluir
- [ ] T018 [P] [US3] Criar `PaginaEditarGasto` stub em `src/pages/editar-gasto/ui/PaginaEditarGasto.tsx` — Server Component que recebe `params: { id: string }`; chama `obterContextoUsuario()` e busca o gasto com `clientePrisma.gasto.findUniqueOrThrow({ where: { id, contaFamiliaId } })`; exibe título "Editar Gasto" e campos pré-preenchidos (nome, valor) como stub; UI completa fica para feature futura (R-008)
- [ ] T019 [P] [US3] Criar `src/pages/editar-gasto/index.ts` exportando `PaginaEditarGasto`
- [ ] T020 [US3] Criar `app/(app)/gastos/[id]/editar/page.tsx` importando `PaginaEditarGasto`; receber `params: Promise<{ id: string }>` conforme convenção Next.js 16 App Router

**Checkpoint**: Drag-to-reveal funcional em `GASTO_DINHEIRO`. Excluir com confirmação remove item e atualiza saldo. Editar navega para stub sem 404. US3 testável de forma independente.

---

## Phase 6: User Story 4 — Buscar transações por nome (Priority: P2)

**Goal**: Campo de busca filtra a lista em tempo real (debounce 400ms). URL atualizada com `?busca=termo`. Estado vazio específico para busca sem resultados.

**Independent Test**: Digitar parte do nome de uma transação e verificar que a lista filtra em < 500ms. Limpar e verificar que todos os itens voltam. Digitar um termo inexistente e verificar mensagem específica.

- [ ] T021 [US4] Criar `BarraBuscaHistorico` em `src/widgets/historico-transacoes/ui/BarraBuscaHistorico.tsx` — `"use client"` — lê `busca` atual de `useSearchParams()`; ao digitar, aplica debounce de 400ms e chama `router.replace(pathname + '?' + newParams.toString())` com `newParams.set('busca', termo).set('pagina', '1')` (reset de página ao buscar); botão de limpar reseta `busca` para `""` e `pagina` para `1`; elemento `<input type="search">` com label acessível
- [ ] T022 [US4] Atualizar `app/(app)/dashboard/page.tsx` para ler `searchParams.busca` e `searchParams.pagina`; validar com `schemaFiltrosHistorico.parse(searchParams)` (Zod coerce garante tipos); passar filtros validados para `PaginaDashboard` e desta para `ListaHistoricoTransacoes`
- [ ] T023 [US4] Atualizar `ListaHistoricoTransacoes` em `src/widgets/historico-transacoes/ui/ListaHistoricoTransacoes.tsx` para incluir `<BarraBuscaHistorico />` no topo da seção; quando `transacoes.length === 0` e `filtros.busca !== ""` exibir `"Nenhuma transação encontrada para '${filtros.busca}'"` (estado vazio de busca, distinto do estado vazio geral)

**Checkpoint**: Busca funcional com filtragem em tempo real, URL sincronizada e estados vazios corretos. US4 testável de forma independente.

---

## Phase 7: User Story 5 — Navegar por páginas de transações (Priority: P2)

**Goal**: Controles de paginação exibem página atual e total; navegam entre páginas sem perder o contexto de busca.

**Independent Test**: Com > 20 transações, abrir `/dashboard` e verificar que só 20 itens aparecem. Avançar para página 2 e verificar itens diferentes sem repetição. Na última página, botão "Próxima" desabilitado.

- [ ] T024 [US5] Criar `PaginacaoHistorico` em `src/widgets/historico-transacoes/ui/PaginacaoHistorico.tsx` — `"use client"` — recebe `paginaAtual: number`, `totalPaginas: number`, `busca: string`; gera URLs de paginação preservando `busca`: `href={pathname + '?busca=' + busca + '&pagina=' + n}`; usa `<Link>` para navegação sem recarregamento; botão "Anterior" desabilitado/oculto quando `paginaAtual === 1`; botão "Próxima" desabilitado/oculto quando `paginaAtual === totalPaginas`; exibe `"Página ${paginaAtual} de ${totalPaginas}"`
- [ ] T025 [US5] Atualizar `ListaHistoricoTransacoes` em `src/widgets/historico-transacoes/ui/ListaHistoricoTransacoes.tsx` para incluir `<PaginacaoHistorico />` abaixo da lista quando `totalPaginas > 1`; passar `paginaAtual`, `totalPaginas` e `busca` como props
- [ ] T026 [US5] Verificar que `app/(app)/dashboard/page.tsx` já repassa `pagina` dos searchParams para `ListaHistoricoTransacoes` via filtros validados (deve estar coberto por T022; confirmar ou ajustar)

**Checkpoint**: Paginação funcional sobre conjunto total e filtrado. Contexto de busca preservado ao mudar página. US5 testável de forma independente.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Propósito**: Qualidade, acessibilidade, responsividade e verificação final.

- [ ] T027 [P] Auditar acessibilidade de todos os componentes do widget (`ListaHistoricoTransacoes`, `ItemTransacao`, `BarraBuscaHistorico`, `PaginacaoHistorico`, `DialogoConfirmarExclusao`): elementos semânticos (`<ul>/<li>`, `<button>`, `<dialog>` ou role dialog), labels visíveis, gerenciamento de foco no diálogo de confirmação, navegação por teclado nos controles de paginação
- [ ] T028 Validar responsividade em viewport 375px (SC-008): verificar no DevTools que nome, valor, data e tipo não são truncados; drag-to-reveal funcional em touch; layout sem overflow horizontal
- [ ] T029 Executar `npm run lint` e `npm run build` e corrigir todos os erros — gate obrigatório pela constituição
- [ ] T030 Percorrer os cenários do `specs/008-dashboard-historico-transacoes/quickstart.md` e confirmar que todos os critérios de aceitação passam

---

## Dependências & Ordem de Execução

### Dependências entre fases

- **Phase 1 (Setup)**: Sem dependências — pode começar imediatamente
- **Phase 2 (Fundacional)**: Depende da conclusão da Phase 1 — **bloqueia todas as US**
- **Phase 3–7 (US1–US5)**: Todas dependem da Phase 2
  - US1, US2 e US3 são P1 — implementar nessa ordem (US2 depende de US1 para a página, US3 depende de US2 para o componente)
  - US4 e US5 são P2 — podem iniciar após US2 (lista precisa existir para busca/paginação)
- **Phase 8 (Polish)**: Após todas as US desejadas estarem completas

### Dependências entre user stories

- **US1 (P1)**: Pode iniciar após Phase 2. Sem dependência de outras US.
- **US2 (P1)**: Pode iniciar após Phase 2. Integra com a página criada em US1.
- **US3 (P1)**: Pode iniciar após US2 (drag-to-reveal modifica `ItemTransacao`).
- **US4 (P2)**: Pode iniciar após US2 (lista precisa existir). Independente de US3.
- **US5 (P2)**: Pode iniciar após US2. Independente de US3 e US4 (mas usa mesmos searchParams de US4).

### Dentro de cada user story

- Tipos/schemas (Phase 2) antes de queries
- Queries antes de Server Components
- Server Components antes de Client Components que os consomem
- Server Actions (T015) antes de integrá-las no componente (T016, T017)

### Oportunidades de paralelismo

- T002 e T003 (tipos e schemas): paralelos entre si
- T004 e T005 (queries): T005 pode rodar em paralelo pois operam em funções distintas no mesmo arquivo
- T007 (skeleton) e T009 (index.ts): paralelos com T008 (PaginaDashboard)
- T018 e T019 (stub editar-gasto): paralelos entre si e com T015, T016, T017
- T027 (acessibilidade) e T028 (responsividade): paralelos entre si

---

## Exemplo de execução paralela: Phase 2

```
# Pode rodar ao mesmo tempo:
T002: tipos em src/entities/gasto/model/tipos.ts
T003: schemas em src/entities/gasto/model/schemas.ts

# Depois T002 e T003 concluídos:
T004: listarTransacoesUnificadas em src/entities/gasto/api/consultas.ts
T005: contarTransacoesUnificadas em src/entities/gasto/api/consultas.ts

# Depois T004 e T005 concluídos:
T006: re-exports em server.ts e index.ts
```

---

## Estratégia de implementação

### MVP First (US1 + US2 + US3 — tudo P1)

1. Concluir Phase 1: Setup
2. Concluir Phase 2: Fundacional (**CRÍTICO** — bloqueia tudo)
3. Concluir Phase 3: US1 (saldo) → validar
4. Concluir Phase 4: US2 (lista) → validar
5. Concluir Phase 5: US3 (drag-to-reveal) → validar
6. **PARAR E VALIDAR**: Todas as P1 funcionando; dashboard utilizável
7. Prosseguir com P2 se desejado

### Entrega incremental

1. Setup + Fundacional → infra pronta
2. US1 → saldo visível → validar
3. US2 → lista unificada → validar (MVP utilizável!)
4. US3 → drag-to-reveal + editar/excluir → validar
5. US4 → busca por nome → validar
6. US5 → paginação → validar
7. Polish → qualidade final

---

## Notas

- **[P]**: arquivos distintos, sem dependência de tarefa incompleta naquele momento
- **[Story]**: rastreabilidade da tarefa à user story
- Cada US é completável e testável de forma independente
- Verificar `npm run lint` + `npm run build` após cada fase
- `contaFamiliaId` NUNCA aceito do cliente — sempre de `obterContextoUsuario()`
- Valores monetários: `Decimal` no banco, `string` serializada em `TransacaoUnificada.valor`
- Threshold de drag: 80px (D-003)
- Debounce de busca: 400ms (D-002)
- Página padrão: 20 itens, `limite` máximo 100 (schema Zod)
