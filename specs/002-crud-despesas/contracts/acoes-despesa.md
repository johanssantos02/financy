# Contrato: operações de despesa (Server Actions + consultas)

Módulo público: `src/features/despesas/index.ts` (ações) e `src/entities/despesa/index.ts`
(consulta de listagem). Todas as operações:

1. obtêm `{ usuarioId, papel, contaFamiliaId }` da sessão no servidor (nunca do cliente);
2. validam a entrada com Zod;
3. retornam `Resultado<T>` (nunca lançam para erros esperados);
4. após mutação com sucesso chamam `revalidatePath("/despesas")`.

## Tipo de resultado e erros

```ts
type TipoErro =
  | "VALIDACAO" | "NAO_AUTENTICADO" | "SEM_PERMISSAO"
  | "NAO_ENCONTRADO" | "CONFLITO" | "ERRO_INTERNO";

type ErroAplicacao = {
  status: 400 | 401 | 403 | 404 | 409 | 500;
  tipo: TipoErro;
  mensagem: string;                    // português, sem detalhes internos
  campos?: Record<string, string[]>;   // só em VALIDACAO
};

type Resultado<T> = { sucesso: true; dados: T } | { sucesso: false; erro: ErroAplicacao };
```

Erros comuns a todas: `NAO_AUTENTICADO` (sem sessão) · `SEM_PERMISSAO` com mensagem
"Você não participa de uma conta família." (usuário sem conta) · `ERRO_INTERNO` (inesperado).

## Entradas

```ts
// schemaDespesa (criar) — editar usa .partial() + id
{
  nome: string;              // obrigatório, trim, 1..80
  valor: string;             // obrigatório, /^\d{1,10}([.,]\d{1,2})?$/, > 0
  vencimento: string;        // obrigatório, "AAAA-MM-DD" válido
  lancamento?: string;       // "AAAA-MM-DD", padrão hoje
  recorrente?: boolean;      // padrão false
  descricao?: string;        // trim, ≤ 500, vazio → null
  tags?: string[];           // cada uma trim 1..30, ≤ 10, duplicadas removidas
}
```

Aceita objeto ou `FormData` (para uso futuro com `useActionState`).

## Operações

| Função | Entrada | Sucesso | Erros específicos |
| --- | --- | --- | --- |
| `criarDespesa` | `schemaDespesa` | `{ id }` | `VALIDACAO`; `CONFLITO` "Já existe uma despesa com este nome." |
| `editarDespesa` | `{ id, ...parcial }` | `{ id }` | `VALIDACAO`; `NAO_ENCONTRADO`; `CONFLITO` (nome) |
| `excluirDespesa` | `{ id }` | `{ id }` | `SEM_PERMISSAO` "Apenas administradores podem excluir despesas."; `NAO_ENCONTRADO` |
| `marcarDespesaComoPaga` | `{ id, competencia: "AAAA-MM" }` | `{ id, competencia }` | `VALIDACAO` (competência fora da vigência); `NAO_ENCONTRADO`; `CONFLITO` "Esta despesa já está paga neste mês." |
| `desmarcarPagamentoDespesa` | `{ id, competencia }` | `{ id, competencia }` | `NAO_ENCONTRADO`; `CONFLITO` "Esta despesa não está paga neste mês." |
| `obterDespesa` | `{ id }` | detalhe da despesa (campos + tags) | `NAO_ENCONTRADO` |
| `listarDespesas` | `FiltrosDespesa` | `ListagemDespesas` | `VALIDACAO` não ocorre: filtros inválidos são descartados |

`listarDespesas` é uma função de servidor (não Server Action) consumida pela página.

## Filtros de listagem (URL de `/despesas`)

| Parâmetro | Formato | Conta no indicador |
| --- | --- | --- |
| `q` | texto, trim, ≤ 100; vazio = ausente | não |
| `mes` | `AAAA-MM`; ausente = mês atual | sim, se diferente do mês atual |
| `situacao` | repetível: `aberta`, `vencimento-proximo`, `vencida`, `paga` | 1 se presente |
| `tag` | repetível, nome da tag | 1 se presente |
| `recorrente` | `sim` \| `nao` | 1 se presente |

```ts
type ListagemDespesas = {
  competencia: string;                       // "AAAA-MM"
  grupos: { grupo: GrupoSituacao; itens: OcorrenciaDespesa[] }[]; // só grupos não vazios, na ordem VENCIDAS, ABERTAS, PAGAS
  totalFiltrosAplicados: number;
  tagsDisponiveis: string[];                 // para o painel de filtros
};
```
