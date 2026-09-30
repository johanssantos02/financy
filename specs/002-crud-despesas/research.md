# Research: CRUD de Despesas

**Feature**: `002-crud-despesas` | **Date**: 2026-09-30

Fontes consultadas: `spec.md`, constituição, `agents/*.md`, `prisma/schema.prisma`, `auth.ts`,
widget `navbar-rodape` e a documentação instalada em `node_modules/next/dist/docs/` (Next 16.3.3:
`page.md`, `loading.md`, `components/form.md`, `07-mutating-data.md`, `catchError.md`).

---

## R1. Modelo de recorrência (FR-010 — opção A validada)

**Decision**: a `Despesa` é cadastrada uma única vez. O pagamento de cada mês é registrado em
`PagamentoDespesa (despesaId, competencia)` com unicidade composta. As ocorrências de um mês são
calculadas por uma função pura de domínio:

- recorrente → aparece em toda competência `M >= mês(vencimento)`; vencimento no mês =
  `min(dia(vencimento), últimoDia(M))`;
- não recorrente → aparece apenas quando `mês(vencimento) == M`.

`competencia` é persistida como data do primeiro dia do mês (`@db.Date`).

**Rationale**: zero rotinas agendadas, zero registros duplicados, qualquer mês consultável;
a unicidade `(despesaId, competencia)` impede pagamento duplicado inclusive em concorrência.

**Alternatives considered**: pré-geração de N meses (exige job e edição em massa); geração
ao pagar (mês seguinte não aparece antes do pagamento — viola US3).

---

## R2. Escopo de acesso por conta família (FR-011 — opção A validada)

**Decision**: `Despesa` e `Tag` possuem `contaFamiliaId`. Um caso de uso `obterContextoUsuario`
resolve no servidor `{ usuarioId, papel, contaFamiliaId }` a partir da sessão, usando a primeira
associação em `ContaFamiliaMembro` ordenada por `entradoEm`. Toda consulta e mutação filtra por
`contaFamiliaId`; registros fora do escopo retornam `NAO_ENCONTRADO`.

**Rationale**: reaproveita `ContaFamilia` já existente; `usuarioId`/`contaFamiliaId` nunca vêm do
cliente (princípio IV).

**Consequência documental**: atualizar princípio IV da constituição (MINOR → 1.1.0) e
`agents/DOMINIO.md` para "todo dado financeiro pertence a um usuário ou a uma conta família".

---

## R3. Situação derivada (FR-004)

**Decision**: persistir apenas o pagamento. `calcularSituacao(vencimentoNoMes, pago, hoje)`:
`PAGA` se pago; `VENCIDA` se `vencimento < hoje`; `VENCIMENTO_PROXIMO` se
`vencimento <= hoje + 5 dias`; senão `ABERTA`. `hoje` é a data civil em `America/Sao_Paulo`
obtida via `Intl.DateTimeFormat` (sem dependência nova).

**Rationale**: a situação muda com o tempo; armazená-la exigiria job e poderia divergir.

**Alternatives considered**: coluna `status` atualizada por cron — rejeitada (complexidade, drift).

---

## R4. Exclusão e unicidade de nome

**Decision**: exclusão lógica (`excluidoEm`). Unicidade por
`@@unique([contaFamiliaId, nomeNormalizado])`, com `nomeNormalizado String?` definido como
`lower(trim(nome))` na criação/edição e **anulado na exclusão** (PostgreSQL aceita múltiplos
`NULL` em índice único). A mesma estratégia vale para `Tag.nomeNormalizado` (sem exclusão).

Visibilidade após exclusão: despesa não recorrente some de todas as competências; recorrente
continua visível apenas nas competências **anteriores** ao mês da exclusão (histórico preservado,
regra de domínio "não modificar ocorrências passadas").

**Rationale**: índice único real no banco protege contra corrida; evita índice parcial, que o
schema Prisma não expressa e geraria drift em `migrate dev`.

**Alternatives considered**: exclusão física com cascade (perde histórico de pagamentos);
índice parcial `WHERE deleted_at IS NULL` escrito à mão na migration (drift).

Comparação "sem diferenciar maiúsculas/minúsculas": `trim` + `toLocaleLowerCase("pt-BR")`.
Acentos continuam diferenciando ("Água" ≠ "Agua"), por simplicidade.

---

## R5. Permissão de exclusão (FR-008)

**Decision**: `excluirDespesa` relê `User.role` no banco (o JWT pode estar desatualizado) e exige
`ADMIN`; caso contrário retorna `SEM_PERMISSAO` (403).

---

## R6. Padrão de erro (FR-013) e transporte das operações

**Decision**: operações expostas como **Server Actions** (constituição II — Route Handlers só para
integrações). Todas retornam o tipo discriminado:

```ts
type Resultado<T> =
  | { sucesso: true; dados: T }
  | { sucesso: false; erro: { status: number; tipo: TipoErro; mensagem: string; campos?: Record<string, string[]> } }
```

`TipoErro`: `VALIDACAO` 400 · `NAO_AUTENTICADO` 401 · `SEM_PERMISSAO` 403 · `NAO_ENCONTRADO` 404 ·
`CONFLITO` 409 · `ERRO_INTERNO` 500. Um utilitário `tratarErro(erro)` em `shared` converte exceções
inesperadas e erros conhecidos do Prisma (`P2002` → `CONFLITO`, `P2025` → `NAO_ENCONTRADO`) em
`ERRO_INTERNO`/tipos correspondentes, registrando o detalhe com `console.error` e devolvendo
mensagem genérica.

**Rationale**: cumpre "status code, errorType e message" sem Route Handlers; segue a convenção
"resultados esperados como tipos discriminados".

---

## R7. Listagem no servidor, busca e filtros

**Decision**:
- `app/(app)/despesas/page.tsx` (Server Component) lê `searchParams` (Promise no Next 16), valida
  com Zod (`schemaFiltrosDespesa`, valores inválidos descartados → FR/edge case) e passa ao widget.
- Busca e filtros usam `next/form` (`<Form action="/despesas">`, GET): navegação no cliente sem
  JS próprio, progressive enhancement e URL compartilhável (FR-025). Campo vazio é removido da URL.
- Parâmetros: `q`, `mes` (`AAAA-MM`), `situacao` (repetível), `tag` (repetível), `recorrente`
  (`sim`|`nao`).
- Texto e recorrência filtrados no banco (`contains`, `mode: "insensitive"` em nome, descrição e
  nome de tag); situação filtrada após o cálculo (volume ≤ 200 itens/mês).
- Contador = quantidade de parâmetros de filtro presentes (`mes` diferente do atual conta 1;
  `q` não conta). O "x" é um `<Link>` para `/despesas?q=<q atual>` (remove só os filtros).
- Painel de filtros: `<details>`/`<summary>` nativo estilizado — sem estado React, acessível por
  teclado. Único Client Component novo além do toast: nenhum necessário para a listagem.

**Alternatives considered**: `useSearchParams` + `router.push` em Client Component (mais código,
regra de URL no navegador); Route Handler + fetch no cliente (viola "dados direto do servidor").

---

## R8. Loading skeleton

**Decision**: `app/(app)/despesas/loading.tsx` (navegação inicial) **e**
`<Suspense key={chaveFiltros} fallback={<EsqueletoListaDespesas/>}>` envolvendo a lista na página,
para que o esqueleto também apareça quando apenas os `searchParams` mudam.

---

## R9. Toast

**Decision**: instalar `react-hot-toast`. `shared/ui/notificacoes` exporta `<ProvedorNotificacoes/>`
(`"use client"`, renderiza `<Toaster/>` com cores da paleta) incluído em `app/layout.tsx`, e
`<NotificarErro erro={...}/>` (`"use client"`, dispara `toast.error` em `useEffect`) usado quando a
listagem retorna erro. Para as ações futuras, `notificarResultado(resultado, mensagemSucesso)`.

---

## R10. Navbar (FR-015)

**Decision**: em `NavbarRodape.tsx`, `itens[1]` passa a `{ rotulo: "Despesas", rota: "/despesas",
icone: <Wallet/> }` (lucide). O `CreditCard` continua representando "Nova dívida" no menu.

---

## R11. Cor de erro

**Decision**: adicionar tokens `--perigo` (`#dc2626`) e `--perigo-bg` (`#fef2f2`) em
`app/globals.css` (`--color-perigo`, `--color-perigo-claro`), já que a paleta não possui vermelho.
Pagas: `opacity-60`.

---

## R12. Testes

**Decision**: o projeto não possui infraestrutura de testes. As funções de domínio
(`calcularOcorrencias`, `calcularSituacao`, `normalizarNome`) são puras para permitir testes
futuros; a validação desta entrega é manual via `quickstart.md`, `npm run lint` e `npm run build`.
