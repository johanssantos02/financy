# Data Model: Tela de nova despesa

Nenhuma alteração de schema ou migration. A feature grava na entidade `Despesa` já existente
(`prisma/schema.prisma`, tabela `expenses`; ver `specs/002-crud-despesas/data-model.md`).

## Campos do formulário → Despesa

| Campo na tela | Nome no `FormData` | Obrigatório | Regra (schemaDespesa) | Coluna |
| --- | --- | --- | --- | --- |
| Nome | `nome` | sim | texto aparado, 1–80 caracteres | `name` (+ `normalized_name`) |
| Descrição | `descricao` | não | aparado, até 500; vazio → `null` | `description` |
| Vencimento | `vencimento` | sim | data civil `AAAA-MM-DD` válida | `due_date` |
| Valor | `valor` | sim | `^\d{1,10}([.,]\d{1,2})?$`, `,` → `.`, > 0 | `amount` Decimal(12,2) |
| Despesa recorrente | `recorrente` | não | checkbox: `"on"` → `true`; ausente → `false` | `recurring` |

## Definidos pelo sistema (não enviados pela tela)

| Campo | Origem |
| --- | --- |
| `contaFamiliaId` | sessão (`obterContextoUsuario`) |
| `criadoPorId` | sessão |
| `nomeNormalizado` | `normalizarNome(nome)` — trim + minúsculas pt-BR |
| `lancamento` | `hojeEmSaoPaulo()` (default do schema) |
| `tags` | `[]` (fora do formulário) |

## Unicidade do nome

- Verificação prévia: `existeNomeDespesa(contaFamiliaId, nome)` considera apenas despesas ativas
  (excluídas têm `nomeNormalizado = null`).
- Garantia final: índice único `(family_account_id, normalized_name)`; violação concorrente (`P2002`)
  vira `CONFLITO` com a mesma mensagem.

## Estado da tela (cliente)

| Estado | Tipo | Uso |
| --- | --- | --- |
| `errosPorCampo` | `Partial<Record<"nome" \| "descricao" \| "vencimento" \| "valor", string>>` | borda vermelha, `aria-invalid`, mensagem sob o campo |
| `isPending` | `boolean` (`useTransition`) | desabilita "Salvar" e mostra "Salvando…" |

Transições: `ocioso → enviando → (sucesso: navega de volta) | (falha: ocioso com errosPorCampo)`.
Editar um campo remove a entrada correspondente de `errosPorCampo`.
