# Quickstart: Validação de Receitas/Entradas

**Feature**: `005-crud-receitas` | **Date**: 2026-10-13

Guia de validação end-to-end. Execute após aplicar a migration e subir o servidor de desenvolvimento.

## Pré-requisitos

1. Migration aplicada: `npx prisma migrate dev`
2. Servidor rodando: `npm run dev`
3. Usuário ADMIN autenticado (para testar exclusão)
4. Usuário comum autenticado (para validar restrição de exclusão)

## Cenário 1 — Cadastro de salário

**Passos**:
1. Abra `/entradas`
2. Toque no "+" do footer → "Nova entrada" → confirme que navega para `/entradas`
3. Toque no botão "Nova entrada" da página → modal abre (bottom-sheet no mobile)
4. Preencha: Valor `R$ 5.000,00`, Tipo `Salário` → campo "Mês de recebimento" aparece
5. Preencha: Mês de recebimento `2026-10`, Descrição em branco
6. Confirme → modal fecha → receita aparece na lista com valor e competência

**Verificação no banco**:
```sql
SELECT id, amount, type, reference_month, description FROM incomes
WHERE family_account_id = '<id>';
-- Esperado: amount=5000.00, type='salary', reference_month='2026-10-01', description=null
```

## Cenário 2 — Cadastro de outra entrada (sem competência)

**Passos**:
1. Abra o modal "Nova entrada"
2. Selecione Tipo `Outro` → campo "Mês de recebimento" não aparece
3. Preencha Valor `R$ 300,00`, Descrição `Freelance`
4. Confirme → receita aparece na lista sem competência exibida

## Cenário 3 — Validação de campos obrigatórios

**Passos**:
1. Abra o modal
2. Deixe o valor em branco → tente confirmar → erro inline em "Valor"
3. Selecione Tipo `Salário`, não preencha competência → tente confirmar → erro inline em "Mês de recebimento"
4. Preencha valor `0` → erro "O valor deve ser maior que zero."
5. Preencha valor `-10` → erro de validação

## Cenário 4 — Edição com troca de tipo

**Passos**:
1. Na lista, abra as opções de uma receita do tipo Salário → toque "Editar"
2. Modal abre com dados preenchidos (valor, tipo Salário, competência)
3. Mude o tipo para `Outro` → campo de competência desaparece
4. Confirme → receita atualizada sem competência

**Verificação no banco**:
```sql
SELECT type, reference_month FROM incomes WHERE id = '<id>';
-- Esperado: type='other', reference_month=NULL
```

## Cenário 5 — Edição de salário (preservar competência editável)

**Passos**:
1. Edite uma receita do tipo Salário
2. Mude a competência de `2026-10` para `2026-11`
3. Confirme → competência atualizada

## Cenário 6 — Exclusão (ADMIN)

**Passos** (autenticado como ADMIN):
1. Na lista, toque no botão de excluir de uma receita
2. `confirm(...)` aparece → cancele → receita permanece
3. Repita → confirme → receita removida da lista

**Verificação no banco**:
```sql
SELECT COUNT(*) FROM incomes WHERE id = '<id>';
-- Esperado: 0 (exclusão física)
```

## Cenário 7 — Exclusão bloqueada (não-ADMIN)

**Passos** (autenticado como usuário comum):
1. Botão de excluir não aparece na lista (controle pelo papel na UI)
2. Via `fetch` direto: `POST /api` com `id` de receita → `SEM_PERMISSAO` 403

## Cenário 8 — Submissão dupla

**Passos**:
1. Abra o modal de cadastro com dados válidos
2. Clique "Salvar" duas vezes rapidamente
3. Apenas uma receita é criada

## Cenário 9 — Erro de servidor

**Passos**:
1. Simule erro no servidor (e.g., desconecte o banco temporariamente)
2. Tente cadastrar → modal permanece aberto com toast de erro
3. Dados preenchidos estão preservados para nova tentativa

## Verificações de regressão

Após implementar, confirme que as telas existentes não foram afetadas:
- `/despesas` — lista e CRUD de despesas funcionando
- `/cartoes` — lista e CRUD de cartões funcionando
- Footer "+" → menu abre com "Nova entrada" apontando para `/entradas`

## Build e lint

```bash
npm run lint    # sem erros
npm run build   # sem erros de tipo ou compilação
```
