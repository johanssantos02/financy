# Contrato: Tela e componentes de receitas

## Rotas

| Rota | Componente page | Dados carregados no servidor | Estados |
|------|-----------------|------------------------------|---------|
| `/entradas` | `app/(app)/entradas/page.tsx` | `obterContextoUsuario` + `listarReceitas`; `papel` para condicionar botão Excluir | `loading.tsx` (esqueleto), vazio (CTA "Adicionar primeira entrada"), lista com modal fechado |

Sem rota `/entradas/nova` ou `/entradas/[id]/editar` — o modal vive na página `/entradas`.

### Atualização necessária em `MenuAcoes`

`widgets/navbar-rodape/ui/MenuAcoes.tsx` — mudar a entrada "Nova entrada" de:
```ts
{ rotulo: "Nova entrada", rota: "/entradas/nova", ... }
```
para:
```ts
{ rotulo: "Nova entrada", rota: "/entradas", ... }
```

## Componentes

### `PaginaEntradas` (`pages/entradas/ui/PaginaEntradas.tsx`)

Server Component. Recebe a lista de receitas e o papel do usuário como props do page. Renderiza:
- Cabeçalho com título "Entradas" e botão "Nova entrada" (abre `ModalReceita` em modo criação).
- Lista de receitas: cada item exibe valor, tipo, competência (se SALARIO) e descrição.
- Botão de excluir visível somente para ADMINs.
- `ModalReceita` montado na página (estado de aberto/fechado gerenciado no cliente).

### `ModalReceita` (`features/receitas/ui/ModalReceita.tsx`)

Client Component. Usa `<dialog>` nativo com `showModal()` e `close()`.

Props:
```ts
type Props = {
  modo: "criar" | "editar";
  receita?: DetalheReceita;      // presente apenas no modo "editar"
  aberto: boolean;
  onFechar: () => void;
}
```

Comportamento:
- Bottom-sheet no mobile (`mb-0 mt-auto rounded-t-2xl`), centralizado no desktop (`my-auto max-w-sm rounded-2xl`) — mesmo CSS de `OpcoesDespesa`.
- Fechar ao clicar no backdrop (clique no `<dialog>` diretamente).
- Fechar com tecla Esc (comportamento nativo do `<dialog>`).
- Ao fechar, limpar erros e estado do formulário.

Campos do formulário:
| Campo | Tipo | Condição de exibição |
|-------|------|----------------------|
| Valor | `input type="text" inputMode="numeric"` com máscara monetária | sempre |
| Tipo | `select` ou botões radio com opções "Salário" / "Outro" | sempre |
| Descrição | `textarea` | sempre |
| Mês de recebimento | `input type="month"` | somente quando `tipo === "SALARIO"` |

Estados de submissão:
- `useTransition` para loading state; botão "Salvar" desabilitado durante envio.
- Erros exibidos por campo (padrão `MensagemErro` como em `FormularioCartao`).
- Sucesso: fechar modal + `toast.success(...)`.
- Erro: manter modal aberto + `toast.error(...)` + erros inline por campo.

### `BotaoExcluirReceita` (`features/receitas/ui/BotaoExcluirReceita.tsx`)

Client Component. Props: `{ id: string; descricao: string | null; valor: string }`.

Comportamento:
- `window.confirm(...)` antes de excluir (padrão de `BotaoExcluirCartao`).
- `useTransition` para loading state.
- Visível apenas quando `papel === "ADMIN"` — controle feito em `PaginaEntradas`.

## Acessibilidade

- `<dialog>` gerencia foco automaticamente ao abrir (`showModal()`).
- Cada campo tem `<label htmlFor>` associado.
- Campos inválidos recebem `aria-invalid` e `aria-describedby` apontando para a mensagem de erro.
- Botão "Excluir" tem `aria-label` identificando a receita: `aria-label={`Excluir receita ${descricao ?? valor}`}`.
