# Tasks: Tela de nova despesa

**Input**: Design documents de `specs/003-tela-nova-despesa/`

**Documentos consultados**: plan.md, spec.md, research.md, data-model.md,
contracts/tela-nova-despesa.md, quickstart.md, constitution.md

**Testes**: não solicitados na spec e sem infraestrutura de testes no projeto — nenhuma task de
teste automatizado. A validação é feita pelo `quickstart.md`, `npm run lint` e `npm run build`.

**Organização**: tasks agrupadas por user story para permitir implementação e validação
independente de cada história.

## Formato: `[ID] [P?] [Story] Descrição com caminho do arquivo`

- **[P]**: pode executar em paralelo (arquivos diferentes, sem dependência de tasks incompletas)
- **[Story]**: user story à qual a task pertence (US1, US2, US3)

**Convenções gerais para todas as tasks**: nomes em português; imports pela API pública
(`@/src/<camada>/<modulo>`); sem `any`; tokens de cor do Tailwind já existentes (`text-texto`,
`text-texto-sec`, `bg-card`, `border-borda`, `text-perigo`, `border-perigo`, `bg-primaria`); mobile-first;
nunca enviar `usuarioId`/`contaFamiliaId` do cliente; ler `node_modules/next/dist/docs/` antes de usar
APIs do Next (`useRouter`, `PageProps`, `metadata`). A Server Action `criarDespesa` NÃO deve ter sua
regra alterada.

---

## Phase 1: Setup

Nenhuma dependência nova nem configuração necessária (ver plan.md → Technical Context). Fase vazia.

---

## Phase 2: Fundacional (Pré-requisitos bloqueantes)

**Objetivo**: utilitários compartilhados usados pelo formulário (cliente) e pela ação (servidor).

⚠️ **CRÍTICO**: nenhuma user story pode começar antes desta fase.

- [X] T001 Criar `src/shared/lib/formulario/index.ts` exportando `lerFormData(entrada: FormData | Record<string, unknown>): Record<string, unknown>` com a mesma lógica hoje em `lerEntrada` de `src/features/despesas/api/acoes.ts`: se não for `FormData`, retorna como está; ignora chaves que começam com `$ACTION`; considera só valores `string`; a chave `tags` vira array filtrando vazios; demais chaves usam o primeiro valor e são omitidas quando `""`. Sem `"use client"`/`"use server"` (função pura usável nos dois lados)
- [X] T002 Em `src/shared/lib/formulario/index.ts`, exportar `schemaCaminhoInterno` (Zod) e `obterCaminhoInterno(valor: unknown): string | null`: aceita somente string que começa com `/`, não começa com `//` nem contém `\`, com até 500 caracteres; qualquer outro valor (incluindo array de searchParams) retorna `null`
- [X] T003 Em `src/features/despesas/api/acoes.ts`, remover a função local `lerEntrada` e o tipo `Entrada` duplicado, passando a usar `lerFormData` de `@/src/shared/lib/formulario` em todas as ações (`criarDespesa`, `editarDespesa` e demais que chamavam `lerEntrada`), sem mudar nenhum outro comportamento

**Checkpoint**: `npm run lint` e `npm run build` passam; ações de despesa continuam funcionando.

---

## Phase 3: User Story 1 — Cadastrar uma nova despesa (Priority: P1) 🎯 MVP

**Objetivo**: rota `/despesas/nova` com título, descrição, aviso de obrigatórios, formulário e
"Salvar", acessível pelo menu de criação, que registra a despesa e volta à tela anterior.

**Teste independente**: em `/despesas`, abrir `+` → "Nova despesa", preencher nome, vencimento e valor,
salvar e ver a despesa listada sem recarregar (quickstart cenários 1–3).

- [X] T004 [P] [US1] Criar `src/features/despesas/ui/FormularioNovaDespesa.tsx` (`"use client"`) com props `{ origem: string | null }`, conforme `contracts/tela-nova-despesa.md`: `<form noValidate onSubmit>` com campos não controlados, cada um com `<label htmlFor>` visível e `id`/`name` iguais ao nome do campo: `nome` (input text, `maxLength={80}`, `autoComplete="off"`, rótulo "Nome *"), `descricao` (textarea, `maxLength={500}`, rótulo "Descrição"), `vencimento` (input `type="date"`, rótulo "Vencimento *"), `valor` (input text, `inputMode="decimal"`, `placeholder="0,00"`, rótulo "Valor *"), `recorrente` (checkbox, desmarcado por padrão, rótulo "Despesa recorrente"); rodapé com botão "Cancelar" (`type="button"`) e "Salvar" (`type="submit"`). Layout mobile-first em coluna, inputs com `border-borda`, alvo de toque ≥ 44px e foco visível
- [X] T005 [US1] Em `src/features/despesas/ui/FormularioNovaDespesa.tsx`, implementar o envio: no `onSubmit`, `preventDefault`, montar `FormData` do form e chamar `criarDespesa(formData)` dentro de `startTransition` (`useTransition`); enquanto `isPending`, desabilitar "Salvar" e trocar o texto para "Salvando…"; em sucesso, `toast.success("Despesa cadastrada.")` (`react-hot-toast`) e executar `voltar()`; em falha, `toast.error(resultado.erro.mensagem)` sem limpar os campos
- [X] T006 [US1] Em `src/features/despesas/ui/FormularioNovaDespesa.tsx`, implementar `voltar()` com `useRouter` de `next/navigation`: se `origem` não for `null` e `window.history.length > 1` → `router.back()`; senão → `router.replace(origem ?? "/despesas")`
- [X] T007 [US1] Exportar `FormularioNovaDespesa` em `src/features/despesas/index.ts` (`export { default as FormularioNovaDespesa } from "./ui/FormularioNovaDespesa";`)
- [X] T008 [P] [US1] Criar `src/pages/nova-despesa/ui/PaginaNovaDespesa.tsx` (Server Component) com props `{ origem: string | null }`, seguindo o container de `src/pages/despesas/ui/PaginaDespesas.tsx` (`<main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">`): `<h1>` "Nova despesa", `<p>` de descrição "Cadastre uma conta a pagar da sua família. Despesas recorrentes se repetem todo mês a partir do vencimento.", `<p>` "Campos marcados com * são obrigatórios." e `<FormularioNovaDespesa origem={origem} />`; criar `src/pages/nova-despesa/index.ts` exportando `PaginaNovaDespesa`
- [X] T009 [US1] Criar `app/(app)/despesas/nova/page.tsx`: `export const metadata = { title: "Nova despesa | Financy" }`; página async recebendo `searchParams` (`PageProps<"/despesas/nova">`), calcular `origem` com `obterCaminhoInterno(params.origem)` e descartá-la (→ `null`) se começar com `/despesas/nova`; renderizar `<PaginaNovaDespesa origem={origem} />`
- [X] T010 [P] [US1] Em `src/widgets/navbar-rodape/ui/MenuAcoes.tsx`, na opção "Nova despesa", navegar para `/despesas/nova?origem=${encodeURIComponent(window.location.pathname + window.location.search)}` (lido no momento do clique); demais opções inalteradas. Se já estiver em `/despesas/nova`, não anexar `origem`

**Checkpoint**: quickstart cenários 1, 2 e 3 funcionam.

---

## Phase 4: User Story 2 — Ser orientado quando há erro no preenchimento (Priority: P1)

**Objetivo**: toast de erro, borda vermelha, mensagem junto ao campo e foco no primeiro campo inválido,
tanto para validação local quanto para erros do servidor (inclusive nome repetido).

**Teste independente**: salvar vazio, com valor "0"/"12,345" e com nome já existente variando caixa e
espaços (quickstart cenários 4–7).

**Depende de**: US1 (T004–T005, mesmo arquivo).

- [X] T011 [US2] Em `src/features/despesas/ui/FormularioNovaDespesa.tsx`, adicionar estado `errosPorCampo: Partial<Record<"nome" | "descricao" | "vencimento" | "valor", string>>` e, para cada um desses campos: classe `border-perigo` quando houver erro, `aria-invalid={true}`, `aria-describedby="<campo>-erro"` e `<p id="<campo>-erro" className="text-sm text-perigo">` com a mensagem; `onChange`/`onInput` do campo remove apenas o erro dele
- [X] T012 [US2] Em `src/features/despesas/ui/FormularioNovaDespesa.tsx`, antes de chamar a ação, validar `schemaDespesa.safeParse(lerFormData(formData))` (`schemaDespesa` de `@/src/entities/despesa`, `lerFormData` de `@/src/shared/lib/formulario`); em falha, montar os erros com `z.flattenError(erro).fieldErrors` (primeira mensagem de cada campo), exibir `toast.error("Verifique os campos informados.")`, aplicar `errosPorCampo` e não chamar o servidor. Regras do schema a respeitar: nome "1–80 caracteres", descrição "até 500", vencimento "data civil `AAAA-MM-DD` válida", valor "`^\d{1,10}([.,]\d{1,2})?$`, > 0"
- [X] T013 [US2] Em `src/features/despesas/ui/FormularioNovaDespesa.tsx`, mapear falhas do servidor: `VALIDACAO` com `erro.campos` → `errosPorCampo` (primeira mensagem por campo); `CONFLITO` → `{ nome: erro.mensagem }`; demais tipos só toast. Toast sempre com `erro.mensagem`
- [X] T014 [US2] Em `src/features/despesas/ui/FormularioNovaDespesa.tsx`, após qualquer falha com erros de campo, focar o primeiro campo inválido na ordem `nome → descricao → vencimento → valor` (via `form.elements.namedItem(campo)` ou refs, em `useEffect` disparado pela mudança de `errosPorCampo`/contador de tentativas, para focar mesmo quando o mesmo erro se repete)

**Checkpoint**: quickstart cenários 4–7 funcionam; nada é registrado em caso de erro.

---

## Phase 5: User Story 3 — Cancelar o cadastro (Priority: P2)

**Objetivo**: "Cancelar" volta à tela de origem sem registrar nada; acesso direto cai em `/despesas`.

**Teste independente**: abrir a tela a partir do Início e de Despesas e cancelar; abrir em nova aba e
cancelar; testar `?origem=//exemplo.com` (quickstart cenários 8–10).

**Depende de**: US1 (T004, T006, T009, T010).

- [X] T015 [US3] Em `src/features/despesas/ui/FormularioNovaDespesa.tsx`, ligar o `onClick` do botão "Cancelar" a `voltar()`; garantir que fique desabilitado enquanto `isPending` para não navegar no meio do envio

**Checkpoint**: quickstart cenários 8–10 funcionam.

---

## Phase 6: Polish & Cross-Cutting

- [X] T016 [P] Atualizar `agents/CONVENCOES.md` com o padrão de formulário: validação com o mesmo schema Zod no cliente e no servidor, envio por `onSubmit` + `useTransition` chamando a Server Action, `lerFormData` em `src/shared/lib/formulario`, erro = toast + `border-perigo` + `aria-invalid`/`aria-describedby` + foco no primeiro campo inválido; e a convenção `?origem=<caminho interno>` para telas de criação (validada com `obterCaminhoInterno`, `router.back()` com fallback `router.replace`)
- [X] T017 [P] Atualizar `agents/ARQUITETURA.md` registrando `src/shared/lib/formulario` e a rota `/despesas/nova` → `pages/nova-despesa` → `features/despesas` (FormularioNovaDespesa), se o documento listar módulos/rotas
- [X] T018 Rodar `npm run lint` e `npm run build` e corrigir qualquer erro
- [ ] T019 Executar todos os cenários de `specs/003-tela-nova-despesa/quickstart.md` (incluindo acessibilidade por teclado, cenário 11) e registrar desvios

---

## Dependencies & Execution Order

- **Fundacional (T001–T003)** → bloqueia todas as histórias. T003 depende de T001.
- **US1 (T004–T010)**: T005 e T006 dependem de T004 (mesmo arquivo); T007 depende de T004; T008
  depende de T007; T009 depende de T002 e T008. T010 é independente.
- **US2 (T011–T014)**: depende de T005; tasks sequenciais (mesmo arquivo).
- **US3 (T015)**: depende de T006.
- **Polish (T016–T019)**: após as histórias; T018 e T019 por último.

```text
T001 → T002 → T003
         └──────────────→ T009
T004 → T005 → T006 → T007 → T008 → T009
        └→ T011 → T012 → T013 → T014
             T006 → T015
T010 (independente)
→ T016, T017 → T018 → T019
```

## Parallel Example

```text
# Depois da fase Fundacional:
T004 FormularioNovaDespesa.tsx   (features)
T010 MenuAcoes.tsx               (widgets)

# Depois de T007:
T008 PaginaNovaDespesa.tsx       (pages)

# Polish:
T016 agents/CONVENCOES.md
T017 agents/ARQUITETURA.md
```

## Implementation Strategy

1. **MVP**: Fundacional + US1 → cadastro funcional com retorno à origem (erros só por toast do
   servidor).
2. **Incremento 2**: US2 → validação local, destaque, mensagens e foco (completa os critérios de
   aceite de erro).
3. **Incremento 3**: US3 → cancelar.
4. Polish: documentação, lint/build e roteiro do quickstart.
