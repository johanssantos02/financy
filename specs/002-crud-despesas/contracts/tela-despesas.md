# Contrato: tela `/despesas`

## Rota e composição

```text
app/(app)/despesas/page.tsx      Server Component: await searchParams → normalizarFiltros → PaginaDespesas
app/(app)/despesas/loading.tsx   EsqueletoListaDespesas
src/pages/despesas               cabeçalho + BarraBuscaDespesas + <Suspense key> ListaDespesas
```

## BarraBuscaDespesas (`<Form action="/despesas">`, GET)

```text
┌──────────────────────────────────────┐ ┌───┐ ┌───┐⁽²⁾ⓧ
│ 🔍 Buscar despesas                    │ │ 🔍│ │ ⚙ │
└──────────────────────────────────────┘ └───┘ └───┘
```

- Input `name="q"`, `type="search"`, ícone `Search` absoluto à esquerda, `aria-label="Buscar despesas"`.
- Botão submit só com ícone `Search`, `aria-label="Buscar"`.
- Botão filtros (`SlidersHorizontal`) = `<summary>` de um `<details>`; `aria-label="Filtros"`.
- Indicador: badge numérico sobre o canto superior direito do botão de filtros quando
  `totalFiltrosAplicados > 0` (`aria-label="N filtros aplicados"`).
- Limpar: `<Link>` com ícone `X` no canto superior direito do badge, `aria-label="Limpar filtros"`,
  destino `/despesas` preservando apenas `q`.
- Painel (conteúdo do `<details>`): mês (`<input type="month" name="mes">`), situação (checkboxes
  `name="situacao"`), tags (checkboxes `name="tag"`), recorrência (radio `name="recorrente"`:
  todas/sim/não) e botão "Aplicar". Os campos pertencem ao mesmo `Form`, então buscar mantém os
  filtros e aplicar filtros mantém o termo.
- Valores vazios são enviados normalmente (ex.: `q=`); `normalizarFiltros` no servidor os trata
  como ausentes, então busca vazia lista sem filtro de texto.

## ListaDespesas

- Seções `<section aria-labelledby>` na ordem Vencidas, Abertas, Pagas com título e total do grupo.
- `ItemDespesa` (`<li>`): nome, valor (`Intl.NumberFormat("pt-BR", { currency: "BRL" })`),
  vencimento (`dd/mm`), selo de situação, tags, ícone `Repeat` se recorrente.
- Vencida: textos e selo em `text-perigo`; borda `border-perigo/30`.
- Vencimento próximo: selo `bg-fundo-sec text-texto` com rótulo "Vence em N dias" ("Vence hoje"
  quando N = 0).
- Paga: `opacity-60`, selo "Paga".
- Vazio: mensagem "Nenhuma despesa encontrada" (+ dica para limpar filtros quando houver).
- Erro: bloco com a mensagem do `ErroAplicacao` + `<NotificarErro>` disparando toast.
- Nenhum botão de ação (pagar/editar/excluir) nesta entrega.

## EsqueletoListaDespesas

Mesma estrutura visual (barra de busca + 2 títulos + 5 itens) com blocos `animate-pulse bg-fundo-sec`,
`aria-busy="true"` e texto visualmente oculto "Carregando despesas".

## Navbar

`itens[1]` = `{ rotulo: "Despesas", rota: "/despesas", icone: Wallet }`; ativo em `/despesas*`.
