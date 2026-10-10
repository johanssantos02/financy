# Contrato: Server Actions e consultas de cartões

Módulo: `src/features/cartoes/api/acoes.ts` (`"use server"`). Todas recebem `EntradaFormulario`
(`FormData | Record<string, unknown>`), passam por `lerFormData` e devolvem `Resultado<T>`
(`src/shared/lib/resultado`). Nenhuma aceita `contaFamiliaId`/`usuarioId` do cliente: se enviados, são
descartados pelo schema.

Sequência obrigatória em todas: `obterContextoUsuario()` → Zod → regra → Prisma (filtrando por
`contaFamiliaId`) → `Resultado` → `revalidatePath("/cartoes")` (mutações). Exceções inesperadas passam por
`tratarErro`.

## `criarCartao(entrada) → Resultado<{ id: string }>`

Entrada: `nome`, `instituicao`, `limite`, `diaFechamento`, `diaVencimento`.

| Situação | Resultado |
|----------|-----------|
| sem sessão | `NAO_AUTENTICADO` 401 |
| sem conta família | `SEM_PERMISSAO` 403 |
| campos inválidos | `VALIDACAO` 400 com `campos` por campo |
| nome já usado na família (pré-checagem ou P2002) | `CONFLITO` 409 "Já existe um cartão com este nome." |
| ok | `sucesso({ id })` |

## `editarCartao(entrada) → Resultado<{ id: string }>`

Entrada: `id` + os cinco campos (formulário completo).

| Situação | Resultado |
|----------|-----------|
| sem sessão / sem família | 401 / 403 |
| inválido | `VALIDACAO` 400 |
| cartão inexistente ou de outra família | `NAO_ENCONTRADO` 404 "Cartão não encontrado." |
| nome em uso por outro cartão da família | `CONFLITO` 409 |
| ok | `sucesso({ id })` — `update` com `where: { id, contaFamiliaId }` via `updateMany` (count 0 → 404) |

## `excluirCartao(entrada) → Resultado<{ id: string }>`

Entrada: `id`.

| Situação | Resultado |
|----------|-----------|
| sem sessão / sem família | 401 / 403 |
| `id` inválido | `VALIDACAO` 400 |
| usuário não é ADMIN (relido do banco) | `SEM_PERMISSAO` 403 "Apenas administradores podem excluir cartões." |
| inexistente ou de outra família (`deleteMany` count 0) | `NAO_ENCONTRADO` 404 |
| vínculo dependente (P2003, futuro) | `CONFLITO` 409 "Este cartão possui registros vinculados e não pode ser excluído." |
| ok | `sucesso({ id })` |

## Consultas de dados (`src/entities/cartao/server.ts`, `server-only`)

- `listarCartoes(contaFamiliaId) → Promise<ResumoCartao[]>` — `orderBy: { nome: "asc" }`, `select` só dos
  campos do resumo.
- `obterCartaoPorId(contaFamiliaId, id) → Promise<DetalheCartao | null>` — `findFirst({ where: { id,
  contaFamiliaId } })`.
- `existeNomeCartao(contaFamiliaId, nome, ignorarId?) → Promise<boolean>`.

## Rotas de interface

| Rota | Tela | Dados no servidor | Estados |
|------|------|-------------------|---------|
| `/cartoes` | `pages/cartoes` | `obterContextoUsuario` + `listarCartoes`; `papel` para mostrar "Excluir" | `loading.tsx` (esqueleto), erro (`NotificarErro` + mensagem), vazio (CTA "Cadastrar primeiro cartão"), lista |
| `/cartoes/novo` | `pages/novo-cartao` | — | formulário vazio |
| `/cartoes/[id]/editar` | `pages/editar-cartao` | `obterCartaoPorId`; `id` validado com Zod; inexistente → `notFound()` | formulário preenchido |

Entrada no app: item "Cartões" do `SidebarMenu` (`widgets/navbar-rodape`) → `Link href="/cartoes"`.
