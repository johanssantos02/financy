# Quickstart: Validação de Tags em Gastos

**Feature**: 009-tags-gastos | **Data**: 2026-10-19

## Pré-requisitos

- Banco de dados com a migration `20261019000000_tags_gastos` aplicada
- Seed executado: `npx prisma db seed` (5 tags GASTOS por conta família)
- App rodando: `npm run dev`
- Usuário autenticado pertencente a uma conta família

## Cenário 1 — Criar gasto com tag (US-1)

1. Abrir o modal "Novo gasto" (botão na navbar)
2. Preencher nome, valor, forma de pagamento = Dinheiro, data
3. No campo **Categoria** (seletor), selecionar "Gasolina"
4. Clicar em "Registrar"

**Esperado**:
- Toast "Gasto registrado."
- Na listagem do dashboard, o novo gasto exibe o badge "Gasolina"
- Sem recarregamento de página

## Cenário 2 — Criar gasto sem tag (US-1, AC-3)

1. Abrir o modal "Novo gasto"
2. Preencher todos os campos obrigatórios; **não** selecionar categoria
3. Clicar em "Registrar"

**Esperado**:
- Toast "Gasto registrado." — sem erro
- Gasto aparece na listagem sem badge de tag (sem espaço vazio)

## Cenário 3 — Criar gasto via cartão com tag (US-2)

1. Abrir modal, selecionar forma de pagamento = Cartão
2. Selecionar um cartão; preencher demais campos
3. Selecionar tag "Alimentação"
4. Confirmar

**Esperado**: gasto registrado com tag; badge "Alimentação" visível na listagem

## Cenário 4 — Editar tag de gasto existente (US-4)

1. Navegar para `/gastos/<id>` de um gasto com tag "Lazer"
2. No formulário de edição, alterar tag para "Saúde"
3. Salvar

**Esperado**: gasto reflete "Saúde" no dashboard imediatamente

## Cenário 5 — Remover tag de gasto (US-4, AC-3)

1. Editar gasto com tag
2. No seletor, escolher a opção "Sem categoria" (value vazio)
3. Salvar

**Esperado**: gasto aparece sem badge de tag; sem erro

## Cenário 6 — Seletor só exibe tags GASTOS (SC-003)

1. Abrir modal "Novo gasto"
2. Inspecionar as opções do seletor de categoria

**Esperado**: apenas as 5 opções GASTOS (lazer, gasolina, saúde, alimentação, outros) — nenhuma
tag do tipo DESPESAS deve aparecer

## Cenário 7 — Exclusão de tag não exclui gasto (FR-010)

*Requer acesso admin ou script direto no banco*

1. Verificar que existe um gasto com `tag_id` preenchido
2. Deletar a tag via SQL: `DELETE FROM tags WHERE id = '<uuid>'`
3. Consultar o gasto: `SELECT tag_id FROM spendings WHERE id = '<uuid>'`

**Esperado**: `tag_id` é NULL; o gasto permanece intacto

## Verificação rápida de build

```bash
npm run lint
npm run build
```

Ambos devem concluir sem erros.

## Referências

- Contratos: [contracts/api-tags-gastos.md](./contracts/api-tags-gastos.md)
- Modelo de dados: [data-model.md](./data-model.md)
- Spec: [spec.md](./spec.md)
