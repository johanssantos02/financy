# Tasks: CRUD de Despesas

**Input**: Design documents de `specs/002-crud-despesas/`

**Documentos consultados**: plan.md, spec.md, research.md, data-model.md,
contracts/acoes-despesa.md, contracts/tela-despesas.md, quickstart.md, constitution.md

**Testes**: não solicitados na spec e sem infraestrutura de testes no projeto — nenhuma task de
teste automatizado. A validação é feita pelo `quickstart.md`, `npm run lint` e `npm run build`.

**Organização**: tasks agrupadas por user story para permitir implementação e validação
independente de cada história.

## Formato: `[ID] [P?] [Story] Descrição com caminho do arquivo`

- **[P]**: pode executar em paralelo (arquivos diferentes, sem dependência de tasks incompletas)
- **[Story]**: user story à qual a task pertence (US1, US2, US3, US4)

**Convenções gerais para todas as tasks**: nomes em português; imports pela API pública
(`@/src/<camada>/<modulo>`); sem `any`; datas civis sempre como string `AAAA-MM-DD` / competência
`AAAA-MM` manipuladas por `src/shared/lib/datas`; nunca receber `usuarioId`/`contaFamiliaId` do
cliente; ler `node_modules/next/dist/docs/` antes de usar APIs do Next.

---

## Phase 1: Setup

**Objetivo**: dependências e tokens visuais necessários.

- [X] T001 Instalar dependências `react-hot-toast` e `server-only` (`npm install react-hot-toast server-only`), atualizando `package.json` e `package-lock.json`
- [X] T002 [P] Adicionar tokens de cor de erro em `app/globals.css`: em `:root` `--perigo: #dc2626;` e `--perigo-bg: #fef2f2;`; em `@theme inline` `--color-perigo: var(--perigo);` e `--color-perigo-claro: var(--perigo-bg);`

---

## Phase 2: Fundacional (Pré-requisitos bloqueantes)

**Objetivo**: schema, infraestrutura compartilhada (resultado/erros, datas, contexto de sessão,
toasts) e o núcleo de domínio da despesa.

⚠️ **CRÍTICO**: nenhuma user story pode começar antes desta fase.

### Schema e migration

- [X] T003 Adicionar ao `prisma/schema.prisma` o modelo `Despesa` (`@@map("expenses")`) exatamente como em `data-model.md`: `id String @id @default(uuid()) @db.Uuid`; `contaFamiliaId String @map("family_account_id") @db.Uuid` com relação `contaFamilia ContaFamilia`; `nome String @map("name")`; `nomeNormalizado String? @map("normalized_name")`; `valor Decimal @map("amount") @db.Decimal(12, 2)`; `vencimento DateTime @map("due_date") @db.Date`; `lancamento DateTime @map("entry_date") @db.Date`; `recorrente Boolean @default(false) @map("recurring")`; `descricao String? @map("description")`; `criadoPorId String @map("created_by") @db.Uuid` com relação `criadoPor User @relation("DespesaCriadaPor")`; `criadoEm DateTime @default(now()) @map("created_at") @db.Timestamptz(3)`; `atualizadoEm DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)`; `excluidoEm DateTime? @map("deleted_at") @db.Timestamptz(3)`; relações `pagamentos PagamentoDespesa[]` e `tags DespesaTag[]`; `@@unique([contaFamiliaId, nomeNormalizado])` e `@@index([contaFamiliaId, vencimento])`
- [X] T004 Adicionar ao `prisma/schema.prisma` os modelos `PagamentoDespesa` (`@@map("expense_payments")`: `id` uuid; `despesaId @map("expense_id")` → `Despesa` com `onDelete: Cascade`; `competencia DateTime @map("reference_month") @db.Date` (sempre dia 1 do mês); `pagoPorId @map("paid_by") @db.Uuid` → `User @relation("PagamentoDespesaPagoPor")`; `pagoEm DateTime @default(now()) @map("paid_at") @db.Timestamptz(3)`; `@@unique([despesaId, competencia])`), `Tag` (`@@map("tags")`: `id` uuid; `contaFamiliaId @map("family_account_id")` → `ContaFamilia`; `nome String @map("name")`; `nomeNormalizado String @map("normalized_name")`; `criadoEm @map("created_at") Timestamptz(3)`; `despesas DespesaTag[]`; `@@unique([contaFamiliaId, nomeNormalizado])`) e `DespesaTag` (`@@map("expense_tags")`: `despesaId @map("expense_id")`, `tagId @map("tag_id")`, ambos uuid com `onDelete: Cascade`, `@@id([despesaId, tagId])`); adicionar as relações inversas `despesas Despesa[]` e `tags Tag[]` em `ContaFamilia` e `despesasCriadas Despesa[] @relation("DespesaCriadaPor")` e `pagamentosDespesa PagamentoDespesa[] @relation("PagamentoDespesaPagoPor")` em `User`
- [X] T005 Gerar a migration **sem conectar no banco** (nenhuma task depende do banco estar migrado): `npm run prisma:validar`; salvar o schema do último commit com `git show HEAD:prisma/schema.prisma > <scratchpad>/schema-anterior.prisma`; criar a pasta `prisma/migrations/<AAAAMMDDHHMMSS>_criar_despesas/` e gerar o SQL com `npx prisma migrate diff --from-schema <scratchpad>/schema-anterior.prisma --to-schema prisma/schema.prisma --script > prisma/migrations/<AAAAMMDDHHMMSS>_criar_despesas/migration.sql`; revisar que o SQL só cria as 4 tabelas, índices e FKs; rodar `npm run prisma:gerar`. **Não** executar `prisma migrate dev`/`deploy` nem qualquer comando que aplique ou resete o banco — a aplicação é feita pelo usuário ao final (T045)

### Infraestrutura compartilhada

- [X] T006 [P] Criar `src/shared/lib/resultado/index.ts` com: `type TipoErro = "VALIDACAO" | "NAO_AUTENTICADO" | "SEM_PERMISSAO" | "NAO_ENCONTRADO" | "CONFLITO" | "ERRO_INTERNO"`; mapa `statusPorTipo` (400, 401, 403, 404, 409, 500); `type ErroAplicacao = { status: 400|401|403|404|409|500; tipo: TipoErro; mensagem: string; campos?: Record<string, string[]> }`; `type Resultado<T> = { sucesso: true; dados: T } | { sucesso: false; erro: ErroAplicacao }`; helpers `sucesso(dados)` e `falha(tipo, mensagem, campos?)`; `erroDeValidacao(zodError)` usando `z.flattenError(...).fieldErrors` e mensagem "Verifique os campos informados."; `tratarErro(erro: unknown): Resultado<never>` que reconhece erro do Prisma com `code` `P2002` → `CONFLITO` e `P2025` → `NAO_ENCONTRADO` (checagem estrutural de `code`, sem importar o Prisma), e qualquer outro → `console.error` + `ERRO_INTERNO` "Algo deu errado. Tente novamente."
- [X] T007 [P] Criar `src/shared/lib/datas/index.ts` (funções puras, sem dependência nova): `hojeEmSaoPaulo(agora = new Date()): string` via `Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" })` retornando `AAAA-MM-DD`; `competenciaDe(data: string): string` (`AAAA-MM`); `competenciaAtual()`; `ehCompetenciaValida(v: string)` (`/^\d{4}-(0[1-9]|1[0-2])$/`); `ehDataValida(v: string)` (`AAAA-MM-DD` existente no calendário); `ultimoDiaDoMes(competencia): number`; `diferencaEmDias(de: string, ate: string): number` (UTC puro a partir das strings); `somarMeses(competencia, n)`; `paraDataBanco(v: string): Date` (`new Date(v + "T00:00:00.000Z")`) e `deDataBanco(d: Date): string` (`toISOString().slice(0, 10)`); `inicioDaCompetencia(competencia): string` (`AAAA-MM-01`)
- [X] T008 [P] Criar `src/shared/lib/sessao/index.ts` com `import "server-only"` e `obterContextoUsuario(): Promise<Resultado<{ usuarioId: string; papel: "USER" | "ADMIN"; contaFamiliaId: string }>>`: chama `auth()` de `@/auth`; sem sessão → `falha("NAO_AUTENTICADO", "Faça login para continuar.")`; busca em `clientePrisma.contaFamiliaMembro.findFirst({ where: { usuarioId }, orderBy: { entradoEm: "asc" }, select: { contaFamiliaId: true } })`; sem registro → `falha("SEM_PERMISSAO", "Você não participa de uma conta família.")`
- [X] T009 [P] Criar `src/shared/ui/notificacoes/ProvedorNotificacoes.tsx` (`"use client"`, renderiza `<Toaster position="top-center" />` do `react-hot-toast` com `toastOptions` usando as variáveis CSS da paleta: fundo `var(--bg-cards)`, texto `var(--texto-principal)`, borda `var(--borda)`, ícone de sucesso `var(--primaria)`, erro `var(--perigo)`), `src/shared/ui/notificacoes/NotificarErro.tsx` (`"use client"`, props `{ erro: ErroAplicacao }`, dispara `toast.error(erro.mensagem, { id: \`${erro.tipo}-${erro.mensagem}\` })` em `useEffect`, retorna `null`), `src/shared/ui/notificacoes/notificarResultado.ts` (`"use client"`, `notificarResultado(resultado, mensagemSucesso)` → `toast.success`/`toast.error`) e `src/shared/ui/notificacoes/index.ts` exportando os três
- [X] T010 Incluir `<ProvedorNotificacoes />` dentro do `<body>` em `app/layout.tsx`, importando de `@/src/shared/ui/notificacoes` (depende de T009)

### Núcleo de domínio da despesa

- [X] T011 [P] Criar `src/entities/despesa/model/tipos.ts` com `SITUACOES = ["ABERTA", "VENCIMENTO_PROXIMO", "VENCIDA", "PAGA"] as const`, `type SituacaoDespesa`, `type GrupoSituacao = "VENCIDAS" | "ABERTAS" | "PAGAS"`, `DIAS_VENCIMENTO_PROXIMO = 5`, `type DespesaBase = { id; nome; valor: string; vencimento: string /*AAAA-MM-DD*/; recorrente: boolean; descricao: string | null; tags: string[]; excluidoEm: string | null /*AAAA-MM-DD*/ }`, `type PagamentoCompetencia = { despesaId; pagoEm: string; pagoPor: string }` e `type OcorrenciaDespesa` conforme `data-model.md` (`despesaId, nome, valor, competencia, vencimento, recorrente, descricao, tags, situacao, diasParaVencimento: number, pagamento: { pagoEm; pagoPor } | null`)
- [X] T012 Criar `src/entities/despesa/model/regras.ts` (puro, sem Next/Prisma; depende de T007, T011) com: `normalizarNome(nome) = nome.trim().toLocaleLowerCase("pt-BR")`; `vencimentoNaCompetencia(despesa, competencia): string | null` — não recorrente: retorna `vencimento` se `competenciaDe(vencimento) === competencia`, senão `null`; recorrente: `null` se `competencia < competenciaDe(vencimento)`, senão `AAAA-MM-` + `min(dia(vencimento), ultimoDiaDoMes(competencia))`; em ambos, se `excluidoEm` existir: não recorrente → sempre `null`; recorrente → `null` quando `competencia >= competenciaDe(excluidoEm)`; `calcularSituacao(vencimento, pago, hoje)`: `PAGA` se pago; `VENCIDA` se `vencimento < hoje`; `VENCIMENTO_PROXIMO` se `diferencaEmDias(hoje, vencimento) <= 5`; senão `ABERTA`; `grupoDaSituacao` (VENCIDA→VENCIDAS, PAGA→PAGAS, demais→ABERTAS); `calcularOcorrencias(despesas, pagamentos, competencia, hoje): OcorrenciaDespesa[]`; `agruparEOrdenar(ocorrencias)` retornando só grupos não vazios na ordem VENCIDAS, ABERTAS, PAGAS, cada um ordenado por `vencimento` asc e depois `nome` (`localeCompare("pt-BR")`); `competenciaPermitida(despesa, competencia): boolean` = `vencimentoNaCompetencia(...) !== null`
- [X] T013 [P] Criar `src/entities/despesa/model/schemas.ts` (Zod 4; depende de T007) com `schemaDespesa`: `nome` string trim `min(1, "Informe o nome.")` `max(80)`; `valor` string trim, regex `/^\d{1,10}([.,]\d{1,2})?$/` com mensagem "Informe um valor válido.", transform trocando `,` por `.`, refine `> 0` ("O valor deve ser maior que zero."); `vencimento` string que passa `ehDataValida` ("Informe o vencimento."); `lancamento` opcional com `ehDataValida`, default `hojeEmSaoPaulo()`; `recorrente` boolean default `false` (aceitar `"on"`/`"true"` vindos de FormData via `z.preprocess`); `descricao` string trim `max(500)` opcional, vazio → `null`; `tags` array de string trim `min(1).max(30)`, `max(10)`, deduplicado por `normalizarNome`, default `[]`; `schemaEditarDespesa = schemaDespesa.partial().extend({ id: z.uuid() })`; `schemaIdDespesa = z.object({ id: z.uuid() })`; `schemaPagamento = z.object({ id: z.uuid(), competencia: z.string().refine(ehCompetenciaValida) })`; tipos inferidos `EntradaDespesa`, `EntradaEditarDespesa`
- [X] T014 Criar `src/entities/despesa/index.ts` exportando tipos, regras e schemas (as consultas e a UI serão adicionadas nas stories)

**Checkpoint**: schema e `migration.sql` prontos (não aplicados), client gerado, infraestrutura de erros/datas/sessão/toast e regras de domínio disponíveis.

---

## Phase 3: User Story 1 — Visualizar as despesas do mês por situação (Priority: P1) 🎯 MVP

**Objetivo**: ícone 2 do navbar abre `/despesas`, que lista no servidor as despesas do mês atual
agrupadas em Vencidas/Abertas/Pagas, com estilos por situação, esqueleto, vazio e erro.

**Teste independente**: com despesas inseridas via `npm run db:studio` (paga, aberta, vencendo em
3 dias, vencida), abrir `/despesas` pelo navbar e conferir cenários 1–3 do `quickstart.md`.

- [X] T015 [US1] Criar `src/entities/despesa/api/consultas.ts` com `import "server-only"` e `listarDespesas(contaFamiliaId: string, filtros: FiltrosDespesa): Promise<ListagemDespesas>` (nesta story `FiltrosDespesa` = `{ competencia: string }`; US2 amplia): consulta `clientePrisma.despesa.findMany` com `where: { contaFamiliaId, OR: [ { recorrente: true, vencimento: { lte: paraDataBanco(fimDaCompetencia) }, OR: [{ excluidoEm: null }, { excluidoEm: { gte: paraDataBanco(inicioDaCompetencia(somarMeses(competencia, 1))) } }] }, { recorrente: false, excluidoEm: null, vencimento: { gte: inicio, lte: fim } } ] }` e `select` apenas de `id, nome, valor, vencimento, recorrente, descricao, excluidoEm, tags: { select: { tag: { select: { nome: true } } } }`; busca `pagamentoDespesa.findMany({ where: { competencia: paraDataBanco(inicioDaCompetencia(competencia)), despesa: { contaFamiliaId } }, select: { despesaId, pagoEm, pagoPor: { select: { name: true } } } })`; converte `Decimal` com `.toFixed(2)` e datas com `deDataBanco`; aplica `calcularOcorrencias` + `agruparEOrdenar` com `hojeEmSaoPaulo()`; retorna `{ competencia, grupos, totalFiltrosAplicados: 0, tagsDisponiveis: [] }`. Definir `type ListagemDespesas` conforme `contracts/acoes-despesa.md` em `src/entities/despesa/model/tipos.ts`
- [X] T016 [P] [US1] Criar `src/entities/despesa/ui/SeloSituacao.tsx` (Server Component): recebe `situacao` e `diasParaVencimento`; rótulos "Aberta", "Vence hoje"/"Vence em N dias" (VENCIMENTO_PROXIMO, `bg-fundo-sec text-texto`), "Vencida" (`bg-perigo-claro text-perigo`), "Paga" (`bg-primaria-claro text-primaria`); pill `rounded-full px-2 py-0.5 text-xs font-medium`
- [X] T017 [US1] Criar `src/entities/despesa/ui/ItemDespesa.tsx` (Server Component, `<li>`; depende de T016): card `bg-card border border-borda rounded-xl p-4 flex flex-col gap-2`; linha 1: nome (`font-medium`) + ícone `Repeat` (lucide, `aria-label="Recorrente"`) quando recorrente + valor à direita formatado com `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })` a partir da string; linha 2: "Vence em dd/mm" (formatado a partir da string, sem `new Date` local) + `SeloSituacao`; linha 3: tags como chips `text-xs bg-fundo-sec text-texto-sec rounded-md px-2`; VENCIDA → nome, valor e data em `text-perigo` e `border-perigo/30`; PAGA → `opacity-60`. Exportar `ItemDespesa` e `SeloSituacao` em `src/entities/despesa/index.ts` (UI) e `listarDespesas` em um ponto de entrada servidor `src/entities/despesa/server.ts` (para não vazar `server-only` a Client Components)
- [X] T018 [P] [US1] Criar `src/widgets/lista-despesas/ui/EsqueletoListaDespesas.tsx`: barra de busca fictícia (input + 2 botões quadrados), 2 títulos de grupo e 5 cards com blocos `animate-pulse bg-fundo-sec rounded`, container com `aria-busy="true"` e `<span className="sr-only">Carregando despesas</span>`
- [X] T019 [US1] Criar `src/widgets/lista-despesas/ui/ListaDespesas.tsx` (async Server Component; depende de T015, T017): props `{ filtros: FiltrosDespesa }`; obtém contexto com `obterContextoUsuario()`; em falha de contexto ou exceção de `listarDespesas` (capturada com `tratarErro`), renderiza bloco `role="alert"` com `erro.mensagem` + `<NotificarErro erro={erro} />`; sem itens → "Nenhuma despesa encontrada" (e "Tente limpar os filtros." se `totalFiltrosAplicados > 0`); com itens → para cada grupo um `<section aria-labelledby>` com `<h2>` "Vencidas"/"Abertas"/"Pagas" + contador, e `<ul className="flex flex-col gap-3">` de `ItemDespesa`; título "Vencidas" em `text-perigo`
- [X] T020 [US1] Criar `src/widgets/lista-despesas/index.ts` exportando `ListaDespesas` e `EsqueletoListaDespesas`
- [X] T021 [US1] Criar `src/pages/despesas/ui/PaginaDespesas.tsx` (Server Component) e `src/pages/despesas/index.ts`: props `{ filtros }`; `<main className="flex flex-col gap-4 p-4 md:p-6 max-w-2xl mx-auto">` com `<h1 className="text-xl font-semibold">Despesas</h1>` e `<Suspense key={JSON.stringify(filtros)} fallback={<EsqueletoListaDespesas />}><ListaDespesas filtros={filtros} /></Suspense>`
- [X] T022 [US1] Criar `app/(app)/despesas/page.tsx` (`export const metadata = { title: "Despesas | Financy" }`; async, `searchParams: Promise<Record<string, string | string[] | undefined>>`; nesta story monta `filtros = { competencia: competenciaAtual() }` e renderiza `<PaginaDespesas filtros={filtros} />`) e `app/(app)/despesas/loading.tsx` renderizando `<EsqueletoListaDespesas />` dentro do mesmo `<main>` da página
- [X] T023 [P] [US1] Em `src/widgets/navbar-rodape/ui/NavbarRodape.tsx`, trocar `itens[1]` para `{ rotulo: "Despesas", rota: "/despesas", icone: <Wallet size={24} strokeWidth={1.75} /> }` (import `Wallet` de `lucide-react`; remover `CreditCard` do import se ficar sem uso)

**Checkpoint**: US1 funcional — `/despesas` lista o mês atual agrupado e estilizado, com esqueleto.

---

## Phase 4: User Story 2 — Buscar e filtrar despesas (Priority: P1)

**Objetivo**: busca por texto e filtros (mês, situação, tags, recorrência) refletidos na URL, com
indicador de quantidade e "x" para limpar.

**Teste independente**: cenários 5–7 do `quickstart.md`.

- [X] T024 [US2] Em `src/entities/despesa/model/schemas.ts`, adicionar `type FiltrosDespesa = { q: string | null; competencia: string; situacoes: SituacaoDespesa[]; tags: string[]; recorrente: boolean | null }` (mover de `tipos.ts` se já existir) e `normalizarFiltros(searchParams: Record<string, string | string[] | undefined>): FiltrosDespesa`: `q` trim ≤ 100, vazio → `null`; `mes` válido por `ehCompetenciaValida` senão `competenciaAtual()`; `situacao` (string ou array) mapeando `aberta|vencimento-proximo|vencida|paga` → enum, descartando inválidos e duplicados; `tag` (string ou array) trim, não vazio, máx. 10; `recorrente` `sim`→`true`, `nao`→`false`, outro → `null`. Nunca lança. Adicionar `contarFiltros(filtros)`: +1 se `competencia !== competenciaAtual()`, +1 se `situacoes.length`, +1 se `tags.length`, +1 se `recorrente !== null` (`q` não conta). Adicionar `paraSearchParams(filtros, { semFiltros?: boolean })` que gera a query string (com `semFiltros` mantém só `q`)
- [X] T025 [US2] Estender `listarDespesas` em `src/entities/despesa/api/consultas.ts` para `FiltrosDespesa` completo: `q` → `AND` com `OR: [{ nome: { contains: q, mode: "insensitive" } }, { descricao: { contains: q, mode: "insensitive" } }, { tags: { some: { tag: { nome: { contains: q, mode: "insensitive" } } } } }]`; `recorrente !== null` → filtra `recorrente`; `tags.length` → `tags: { some: { tag: { nomeNormalizado: { in: tags.map(normalizarNome) } } } }`; `situacoes` aplicadas após `calcularOcorrencias` (em memória); retornar `totalFiltrosAplicados: contarFiltros(filtros)` e `tagsDisponiveis` via `tag.findMany({ where: { contaFamiliaId }, select: { nome: true }, orderBy: { nome: "asc" } })` executado em paralelo com `Promise.all`
- [X] T026 [P] [US2] Criar `src/widgets/lista-despesas/ui/BarraBuscaDespesas.tsx` (Server Component; seguir `contracts/tela-despesas.md`): `Form` de `next/form` com `action="/despesas"`; linha `flex gap-2 items-start`: wrapper `relative flex-1` com ícone `Search` absoluto à esquerda (`left-3`, `text-texto-sec`, `aria-hidden`) e `<input type="search" name="q" defaultValue={filtros.q ?? ""} placeholder="Buscar despesas" aria-label="Buscar despesas" className="w-full h-11 pl-10 pr-3 rounded-xl bg-card border border-borda focus:outline-none focus:ring-2 focus:ring-primaria">`; botão `type="submit"` só com ícone `Search`, `aria-label="Buscar"`, `h-11 w-11 rounded-xl bg-primaria text-white hover:bg-primaria-escuro`; `<details className="relative">` cujo `<summary aria-label="Filtros">` (sem marcador: `list-none [&::-webkit-details-marker]:hidden`) mostra ícone `SlidersHorizontal` em botão `h-11 w-11 rounded-xl border border-borda bg-card`
- [X] T027 [US2] Em `BarraBuscaDespesas.tsx`, implementar o painel dentro do `<details>` (absoluto, `right-0 top-12 z-40 w-72 bg-card border border-borda rounded-xl p-4 shadow-lg flex flex-col gap-4`): `<fieldset>`s com `<legend>` para "Mês" (`<input type="month" name="mes" defaultValue={filtros.competencia}>`), "Situação" (checkboxes `name="situacao"` valores `aberta`, `vencimento-proximo`, `vencida`, `paga` com rótulos "Aberta", "Vencimento próximo", "Vencida", "Paga", marcados conforme filtros), "Tags" (checkboxes `name="tag"` de `tagsDisponiveis`; se vazio, texto "Nenhuma tag cadastrada"), "Recorrência" (radios `name="recorrente"` valores `""` "Todas", `sim`, `nao`) e botão submit "Aplicar filtros" (`bg-primaria text-white`); o painel fica dentro do mesmo `Form` para busca e filtros se preservarem mutuamente
- [X] T028 [US2] Em `BarraBuscaDespesas.tsx`, quando `totalFiltrosAplicados > 0`, renderizar sobre o canto superior direito do botão de filtros (fora do `<summary>`, irmão posicionado `absolute -top-2 -right-2`) um badge `min-w-5 h-5 rounded-full bg-primaria text-white text-xs` com o número (`aria-label="{n} filtros aplicados"`) e, no canto superior direito do badge (`absolute -top-2 -right-2`), um `<Link href={"/despesas" + paraSearchParams(filtros, { semFiltros: true })} aria-label="Limpar filtros">` com ícone `X` (12px) em círculo `bg-texto text-white`; nada é renderizado quando 0
- [X] T029 [US2] Exportar `BarraBuscaDespesas` em `src/widgets/lista-despesas/index.ts`; em `PaginaDespesas.tsx`, renderizar `<BarraBuscaDespesas filtros={filtros} totalFiltrosAplicados={...} tagsDisponiveis={...} />` acima do `Suspense` (obter `tagsDisponiveis` via função server `listarTags(contaFamiliaId)` exportada por `src/entities/despesa/server.ts`; em falha de contexto passar `[]`; `totalFiltrosAplicados = contarFiltros(filtros)`); atualizar `EsqueletoListaDespesas` para não repetir a barra quando usado dentro do `Suspense` (prop `comBarra?: boolean`, `true` só no `loading.tsx`)
- [X] T030 [US2] Em `app/(app)/despesas/page.tsx`, substituir o filtro fixo por `const filtros = normalizarFiltros(await searchParams)`

**Checkpoint**: busca, filtros, indicador e limpar funcionando pela URL; esqueleto aparece ao filtrar.

---

## Phase 5: User Story 3 — Despesas recorrentes nos meses seguintes (Priority: P2)

**Objetivo**: garantir as regras de recorrência na visualização de outros meses.

**Teste independente**: cenário 4 do `quickstart.md` (usa o filtro `mes` da US2).

**Dependência**: usa `?mes=` da US2 (T024/T030) para navegar entre meses.

- [X] T031 [US3] Revisar `vencimentoNaCompetencia` em `src/entities/despesa/model/regras.ts` contra os cenários da US3 e documentar na função (comentário curto) a regra do último dia do mês e a vigência após exclusão; conferir via `node --experimental-strip-types -e` (ou script temporário em scratchpad, não versionado) os casos: dia 31 em fevereiro de ano bissexto e não bissexto → 29/28; competência anterior ao primeiro vencimento → `null`; não recorrente em outro mês → `null`; recorrente excluída em `2026-10-15` → visível em `2026-09`, oculta em `2026-10`
- [X] T032 [US3] Em `src/widgets/lista-despesas/ui/ListaDespesas.tsx`, exibir acima dos grupos o mês de referência por extenso (`Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })` a partir de `inicioDaCompetencia`), para deixar claro qual mês está sendo visto ao usar o filtro

**Checkpoint**: recorrentes aparecem em todos os meses de vigência, pagas só no mês pago.

---

## Phase 6: User Story 4 — Operações de despesa no servidor (Priority: P2)

**Objetivo**: Server Actions de CRUD e pagamento com regras no servidor e erro padronizado.

**Teste independente**: cenário 8 do `quickstart.md`.

- [X] T033 [US4] Adicionar a `src/entities/despesa/api/consultas.ts` (server-only) as funções de dados: `obterDespesaPorId(contaFamiliaId, id)` (`where: { id, contaFamiliaId, excluidoEm: null }`, select de detalhe + tags); `existeNomeDespesa(contaFamiliaId, nomeNormalizado, ignorarId?)`; `sincronizarTags(tx, contaFamiliaId, despesaId, nomes)` (upsert de `Tag` por `contaFamiliaId_nomeNormalizado`, `deleteMany` de `DespesaTag` da despesa e `createMany` das novas); `obterPagamento(despesaId, competencia)`; exportar via `src/entities/despesa/server.ts`
- [X] T034 [US4] Criar `src/features/despesas/api/acoes.ts` (`"use server"`) com utilitário local `lerEntrada(entrada: FormData | Record<string, unknown>)` (FormData → objeto, `tags` via `getAll`) e as ações `criarDespesa` e `editarDespesa`, seguindo a sequência da constituição: `obterContextoUsuario()` → `safeParse` (falha → `erroDeValidacao`) → se nome informado, `existeNomeDespesa` (true → `falha("CONFLITO", "Já existe uma despesa com este nome.")`) → `clientePrisma.$transaction` criando/atualizando `Despesa` (`nomeNormalizado = normalizarNome(nome)`, `valor` como string decimal, datas via `paraDataBanco`, `criadoPorId` da sessão) + `sincronizarTags` → `revalidatePath("/despesas")` → `sucesso({ id })`; editar inexistente/fora da família → `NAO_ENCONTRADO` "Despesa não encontrada."; todo o corpo em `try/catch` com `tratarErro` (P2002 cobre corrida de nome)
- [X] T035 [US4] Em `src/features/despesas/api/acoes.ts`, adicionar `excluirDespesa({ id })`: contexto → validação → reler `clientePrisma.user.findUnique({ where: { id: usuarioId }, select: { role: true } })`; `role !== "ADMIN"` → `falha("SEM_PERMISSAO", "Apenas administradores podem excluir despesas.")`; `updateMany({ where: { id, contaFamiliaId, excluidoEm: null }, data: { excluidoEm: new Date(), nomeNormalizado: null } })`; `count === 0` → `NAO_ENCONTRADO`; `revalidatePath("/despesas")`
- [X] T036 [US4] Em `src/features/despesas/api/acoes.ts`, adicionar `marcarDespesaComoPaga({ id, competencia })`: contexto → `schemaPagamento` → carregar despesa (`NAO_ENCONTRADO` se ausente; para validar vigência, incluir despesas excluídas recorrentes) → `competenciaPermitida` falso → `falha("VALIDACAO", "Esta despesa não existe neste mês.")` → `pagamentoDespesa.create({ despesaId, competencia: paraDataBanco(inicioDaCompetencia(competencia)), pagoPorId: usuarioId })`; erro P2002 → `falha("CONFLITO", "Esta despesa já está paga neste mês.")` (tratar antes do `tratarErro` genérico) → `revalidatePath`; e `desmarcarPagamentoDespesa({ id, competencia })`: `deleteMany({ where: { despesaId: id, competencia, despesa: { contaFamiliaId } } })`; `count === 0` → se a despesa existir `falha("CONFLITO", "Esta despesa não está paga neste mês.")`, senão `NAO_ENCONTRADO`; permitido a qualquer membro, independentemente de quem pagou
- [X] T037 [US4] Em `src/features/despesas/api/acoes.ts`, adicionar `obterDespesa({ id })` retornando `Resultado` com o detalhe (valor como string, datas `AAAA-MM-DD`, tags) e criar `src/features/despesas/index.ts` exportando as sete ações
- [ ] T038 [US4] **(requer T045 — se a migration ainda não foi aplicada, marcar como pendente e seguir, sem bloquear)** Validar manualmente as ações conforme cenário 8 do `quickstart.md` usando uma rota temporária de desenvolvimento **não versionada** (ou script) e remover o artefato temporário ao final; registrar resultados observados

**Checkpoint**: CRUD e pagamento prontos para consumo, com erros `{ status, tipo, mensagem }`.

---

## Phase 7: Polish & Cross-Cutting

- [ ] T039 [P] Emendar `.specify/memory/constitution.md` princípio IV: "Todo registro financeiro pertence a um único usuário ou a uma conta família; `usuarioId` e `contaFamiliaId` DEVEM ser obtidos no servidor…"; versão 1.0.1 → 1.1.0 (MINOR), atualizar "Última alteração: 2026-09-30" e o Sync Impact Report
- [ ] T040 [P] Atualizar `agents/DOMINIO.md` (nova seção "Despesa": dona = conta família, situação derivada com limiar de 5 dias, recorrência mensal calculada + pagamento por competência, nome único por família sem diferenciar maiúsculas, exclusão lógica só por ADMIN, qualquer membro marca/desmarca; ajustar regra geral "Todo dado financeiro pertence a um usuário ou conta família") e `agents/ARQUITETURA.md` (padrão `Resultado<T>`/`ErroAplicacao` em `src/shared/lib/resultado`, `src/shared/lib/sessao`, ponto de entrada `server.ts` para consultas server-only, toasts em `src/shared/ui/notificacoes`)
- [ ] T041 [P] Atualizar `README.md`: remover "regras de geração e alteração de recorrências" e "fuso horário" de Decisões pendentes (registrar: recorrência calculada; America/Sao_Paulo) e citar `react-hot-toast`
- [ ] T042 Revisão de acessibilidade/mobile em `/despesas` (375px): foco visível em input, botões, summary e link de limpar; navegação por teclado abre/fecha o painel; nenhum overflow horizontal; conteúdo não fica sob o navbar
- [ ] T043 Executar `npm run lint` e `npm run build` e corrigir todos os erros
- [ ] T044 **(requer T045 — pendente até o usuário aplicar a migration; não bloqueia a conclusão das demais tasks)** Executar o `quickstart.md` completo (cenários 1–10) e marcar os critérios de aceite da spec

- [ ] T045 **(usuário)** Aplicar a migration após a implementação: `npm run db:migrar` (ou `npm run db:aplicar` em produção) e, em seguida, liberar T038 e T044

---

## Dependencies & Execution Order

### Fases

- **Setup (1)** → **Fundacional (2)** → stories.
- **US1 (3)**: depende só da Fase 2. MVP.
- **US2 (4)**: depende de US1 (estende `listarDespesas`, `PaginaDespesas`, `page.tsx`).
- **US3 (5)**: depende de US2 (usa `?mes=`); regras já vêm da Fase 2.
- **US4 (6)**: depende só da Fase 2 — pode ser feita em paralelo com US1–US3 (arquivos distintos,
  exceto `consultas.ts`, que deve ser editado sequencialmente após T015/T025).
- **Polish (7)**: após todas as stories desejadas.
- **Banco**: nenhuma task de implementação depende da migration aplicada. Lint, build e `prisma generate` funcionam sem banco. Só as validações em execução (T038, T044) dependem de T045, feita pelo usuário ao final.

### Dentro das fases

- T003 → T004 → T005 (mesmo arquivo / migration depende do schema).
- T009 → T010. T007, T011 → T012. T007 → T013.
- T015 → T017/T019; T016 → T017; T019, T018 → T020 → T021 → T022.
- T024 → T025, T026 → T027 → T028 → T029 → T030.
- T033 → T034 → T035 → T036 → T037 → T038 (mesmo arquivo `acoes.ts`).

## Parallel Opportunities

```text
Fase 1:  T001 ‖ T002
Fase 2:  T006 ‖ T007 ‖ T008 ‖ T009 ‖ T011   (após T005 para T008)
         depois T012 ‖ T013 ‖ T010
US1:     T016 ‖ T018 ‖ T023   (enquanto T015 é implementada)
US2:     T026 ‖ T024
US4:     todo o bloco T033–T038 ‖ US1/US2 (outro desenvolvedor), respeitando consultas.ts
Polish:  T039 ‖ T040 ‖ T041
```

## Implementation Strategy

1. **MVP**: Fases 1–2 + US1 → `/despesas` lista o mês atual agrupado (validar cenários 1–3).
2. **Incremento 2**: US2 → busca e filtros por URL.
3. **Incremento 3**: US3 → navegação entre meses confirmando recorrência.
4. **Incremento 4**: US4 → operações de servidor prontas para o modal (feature futura).
5. **Fechamento**: Polish — docs/constituição, lint, build e quickstart completo.

Critérios de aceite da spec atendidos por: schema/migration (T003–T005), CRUD consumível
(T033–T037), UI interativa com botões de busca/filtro funcionais (T026–T030), navbar (T023),
erros padronizados (T006, T034–T036), toast instalado e em uso (T001, T009, T010, T019).
