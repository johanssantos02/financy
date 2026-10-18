# Contrato: Server Actions e consultas de receitas

Módulo: `src/features/receitas/api/acoes.ts` (`"use server"`). Todas recebem `EntradaFormulario`
(`FormData | Record<string, unknown>`), passam por `lerFormData` e devolvem `Resultado<T>`
(`src/shared/lib/resultado`). Nenhuma aceita `contaFamiliaId`/`usuarioId` do cliente.

Sequência obrigatória em todas as mutações: `obterContextoUsuario()` → Zod (`safeParse`) → regra de
negócio → Prisma (filtrando por `contaFamiliaId`) → `revalidatePath("/entradas")` → `Resultado`.
Exceções inesperadas passam por `tratarErro`.

## `criarReceita(entrada) → Resultado<{ id: string }>`

Entrada: `valor`, `tipo`, `descricao?`, `competencia?`

| Situação | Resultado |
|----------|-----------|
| sem sessão | `NAO_AUTENTICADO` 401 |
| sem conta família | `SEM_PERMISSAO` 403 |
| campos inválidos (incluindo competência ausente para SALARIO) | `VALIDACAO` 400 com `campos` por campo |
| ok | `sucesso({ id })` |

Nota: `tipo === "OUTRO"` → `competencia` é forçada a `null` antes de persistir, mesmo que enviada pelo cliente.

## `editarReceita(entrada) → Resultado<{ id: string }>`

Entrada: `id` + formulário completo (`valor`, `tipo`, `descricao?`, `competencia?`)

| Situação | Resultado |
|----------|-----------|
| sem sessão / sem família | 401 / 403 |
| campos inválidos | `VALIDACAO` 400 |
| receita inexistente ou de outra família (`updateMany` count 0) | `NAO_ENCONTRADO` 404 "Receita não encontrada." |
| ok | `sucesso({ id })` — `updateMany({ where: { id, contaFamiliaId } })` |

Nota: se `tipo` mudar de `SALARIO` para `OUTRO`, `competencia` é gravada como `null`.

## `excluirReceita(entrada) → Resultado<{ id: string }>`

Entrada: `id`

| Situação | Resultado |
|----------|-----------|
| sem sessão / sem família | 401 / 403 |
| `id` inválido | `VALIDACAO` 400 |
| usuário não é ADMIN (papel relido do banco) | `SEM_PERMISSAO` 403 "Apenas administradores podem excluir receitas." |
| inexistente ou de outra família (`deleteMany` count 0) | `NAO_ENCONTRADO` 404 "Receita não encontrada." |
| ok | `sucesso({ id })` |

## Consultas de dados (`src/entities/receita/server.ts`, `server-only`)

- `listarReceitas(contaFamiliaId) → Promise<ResumoReceita[]>` — `orderBy: { criadoEm: "desc" }`;
  `select` apenas os campos do resumo; exclui registros de outras famílias implicitamente pelo filtro.
- `obterReceitaPorId(contaFamiliaId, id) → Promise<DetalheReceita | null>` — `findFirst({ where: { id, contaFamiliaId } })`.

## Serialização de valores

- `valor`: `Decimal` → `toFixed(2)` na leitura; string `"1234.56"` na escrita (depois de `replace(",", ".")`)
- `competencia`: `Date` → `deDataBanco(competencia).slice(0, 7)` na leitura (`"AAAA-MM"`);
  `paraDataBanco(inicioDaCompetencia(competencia))` na escrita (`Date` UTC dia 1)
