# Research: Tela de nova despesa

Todas as incógnitas do Technical Context foram resolvidas a partir do código existente e da
documentação do Next.js instalada (`node_modules/next/dist/docs/`).

## R1. Reaproveitar a Server Action `criarDespesa`

- **Decision**: a tela chama `criarDespesa` (`src/features/despesas/api/acoes.ts`) sem alterar sua
  regra. A ação já obtém `usuarioId`/`contaFamiliaId` da sessão, valida com `schemaDespesa`, consulta
  `existeNomeDespesa` (nome normalizado) antes de inserir, trata a corrida pelo índice único (`P2002`
  → `CONFLITO`), preenche `lancamento` com hoje e chama `revalidatePath("/despesas")`.
- **Rationale**: atende FR-005 a FR-008 sem código novo de servidor; evita duas fontes de verdade.
- **Alternatives considered**: nova ação específica da tela — rejeitada, duplicaria regra.

## R2. Envio do formulário: `onSubmit` + `useTransition` (não `<form action>`)

- **Decision**: Client Component com `<form noValidate onSubmit>`; o handler faz `preventDefault`,
  valida no cliente e chama `criarDespesa(formData)` dentro de `startTransition`. `isPending`
  desabilita "Salvar" (FR-014).
- **Rationale**: no React 19, `<form action={fn}>` reseta campos não controlados após a ação, o que
  violaria FR-015 (preservar valores em erro). Com `onSubmit` os campos permanecem intactos sem
  precisar torná-los controlados. A ação continua sendo uma Server Action (princípio II).
- **Alternatives considered**: `useActionState` — exigiria mudar a assinatura da ação para
  `(estadoAnterior, formData)` e controlar todos os campos para não perder valores; mais código sem
  ganho. `noValidate` desliga as bolhas nativas do navegador para que a validação e o foco sigam o
  padrão único do app (toast + borda + mensagem).

## R3. Validação no cliente com o mesmo schema

- **Decision**: o formulário valida com `schemaDespesa` (exportado por `@/src/entities/despesa`, sem
  dependência de servidor) antes de enviar. A conversão `FormData → objeto` (campos vazios viram
  ausentes) sai de `acoes.ts` para `src/shared/lib/formulario` e é usada pelos dois lados.
- **Rationale**: mesma regra e mesmas mensagens no cliente e no servidor (FR-005); a função não pode
  continuar em um arquivo `"use server"`, que só exporta funções assíncronas de ação.
- **Alternatives considered**: validar só no servidor — funciona, mas custa uma ida ao servidor para
  erros triviais; duplicar regras no componente — rejeitado (princípio III).

## R4. Mapeamento de erros para campos, destaque e foco

- **Decision**: erros vêm como `Record<campo, string[]>` (formato de `erroDeValidacao`). No cliente,
  o mesmo `z.flattenError` produz esse formato. `CONFLITO` da ação é mapeado para `{ nome: [mensagem] }`.
  O formulário guarda `errosPorCampo` em estado; cada campo recebe `aria-invalid`,
  `aria-describedby` apontando para a mensagem e borda `--perigo`. Após cada falha, o foco vai para o
  primeiro campo inválido na ordem `nome → descricao → vencimento → valor`. Editar um campo remove
  o erro só daquele campo. Toast de erro via `react-hot-toast` com a mensagem do resultado.
- **Rationale**: atende FR-009/FR-010 e reutiliza o resultado discriminado existente.
- **Alternatives considered**: biblioteca de formulários (react-hook-form) — dependência nova sem
  necessidade para 5 campos (princípio V).

## R5. Voltar para a tela anterior

- **Decision**: a opção "Nova despesa" do `MenuAcoes` passa a navegar para
  `/despesas/nova?origem=<pathname+search atual>`, lido de `window.location` no clique. A página valida
  `origem` com Zod (caminho interno: começa com `/`, não com `//`, e não é a própria tela). Ao
  cancelar ou salvar com sucesso:
  - com `origem` válida e `window.history.length > 1` → `router.back()`;
  - caso contrário → `router.replace(origem ?? "/despesas")`.
- **Rationale**: o App Router não expõe se existe entrada anterior *do próprio app* no histórico
  (`history.length` conta páginas externas; `document.referrer` não muda em navegação client-side).
  A presença de `origem` prova que o usuário veio de dentro do app; `router.back()` preserva histórico
  e rolagem. A docs do `revalidatePath` (Server Functions) confirma que páginas já visitadas são
  atualizadas ao serem revisitadas, então a listagem mostra a nova despesa após o `back()` (FR-011).
  `replace` no fallback evita que "voltar" do navegador retorne ao formulário.
- **Alternatives considered**: sempre `router.back()` — falha no acesso direto (sai do app ou não faz
  nada); sempre `router.push("/despesas")` — não respeita a origem e empilha histórico; marcador em
  `sessionStorage` — estado escondido e mais difícil de testar.

## R6. Estrutura FSD e rota

- **Decision**: rota `app/(app)/despesas/nova/page.tsx` (herda o layout com navbar e autenticação);
  página `src/pages/nova-despesa` (Server Component com título, descrição, aviso de obrigatórios);
  formulário `src/features/despesas/ui/FormularioNovaDespesa.tsx` (Client Component). Rota estática
  `nova` tem precedência sobre qualquer segmento dinâmico futuro em `/despesas/[id]`.
- **Rationale**: criação é uma interação do usuário com valor de negócio → camada `features`;
  composição da tela → `pages`; segue o padrão de `pages/despesas`.
- **Alternatives considered**: formulário em `widgets` — não há composição de múltiplas features que
  justifique.
