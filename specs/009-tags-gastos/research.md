# Research: Tags em Gastos

**Feature**: 009-tags-gastos | **Data**: 2026-10-19

## Decisão 1 — Cardinalidade da relação Gasto↔Tag

**Decisão**: relação 1:N direta (Gasto tem zero ou uma Tag via FK `tagId`)

**Rationale**: A spec define explicitamente "Nova coluna tagId em Gasto (FK → Tag, nullable)".
Multi-tag em gastos não é requisito desta versão. Uma FK direta é mais simples, mais rápida de
query e evita criar uma tabela de junção desnecessária.

**Alternativa considerada**: tabela de junção `GastoTag` (idêntica a `DespesaTag`). Rejeitada
porque a spec é explícita em usar FK simples e a simplicidade é preferida (Princípio V).

---

## Decisão 2 — Granularidade do enum TipoTag

**Decisão**: `enum TipoTag { GASTOS @map("spending")  DESPESAS @map("expense") }` com
`@@map("tag_types")`

**Rationale**: Os dois tipos cobrem 100% dos casos de uso da spec. Um campo booleano (`paraGastos`)
foi considerado mas tornaria o filtro menos legível e não escalaria para um terceiro tipo futuro.

**Alternativa considerada**: `tipo String` sem enum — rejeitado porque elimina checagem de tipo
estática e abre espaço para valores inválidos.

---

## Decisão 3 — Unique constraint em Tag

**Decisão**: mudar de `@@unique([contaFamiliaId, nomeNormalizado])` para
`@@unique([contaFamiliaId, nomeNormalizado, tipo])`

**Rationale**: A spec declara explicitamente: "se duas tags tiverem o mesmo nome mas tipos
diferentes devem ser tratadas como entidades distintas". Sem o campo `tipo` na constraint, não
seria possível ter "alimentação (GASTOS)" e "alimentação (DESPESAS)" na mesma conta.

**Impacto na migration**: `DROP CONSTRAINT` da constraint atual + `CREATE UNIQUE INDEX` nova.

---

## Decisão 4 — onDelete em Gasto.tag

**Decisão**: `onDelete: SetNull` (FK `tag_id` vira NULL quando a Tag é deletada)

**Rationale**: FR-010 e edge case da spec são explícitos: "A exclusão de uma tag não DEVE excluir
em cascata os gastos ou despesas vinculados". `SetNull` implementa exatamente esse comportamento
sem código adicional.

**Alternativa considerada**: `onDelete: Restrict` — rejeitado porque impediria exclusão de tags
em uso, conflitando com FR-010. `onDelete: Cascade` — proibido pela spec.

---

## Decisão 5 — Tags globais vs. por conta família

**Ponto em aberto — requer validação do usuário.**

| Opção | Prós | Contras |
|---|---|---|
| **A — Por conta família** (recomendada) | Alinhada com o schema atual; sem migration destrutiva; isolamento de dados por família | Tags iniciais precisam ser semeadas por família |
| B — Global (sem contaFamiliaId em Tag) | Matches spec assumption literal; seed único | Quebra DespesaTag existente; migration complexa; viola isolamento |

**Recomendação**: Opção A. Semear as 5 tags GASTOS via `prisma/seed.ts` iterando sobre todas as
`ContaFamilia` existentes, e repetir o seed ao criar nova conta família (hook em `criarContaFamilia`
ou middleware pós-criação).

---

## Decisão 6 — Onde validar que tagId é do tipo GASTOS

**Decisão**: validação no **servidor**, dentro da Server Action `criarGasto`/`editarGasto`, após
a validação Zod básica (que valida apenas formato uuid). A query de busca da tag já filtra por
`tipo: "GASTOS"` e `contaFamiliaId`, então uma tag inválida simplesmente não é encontrada
e retorna erro `NAO_ENCONTRADO`.

**Rationale**: Princípio III (validação nas fronteiras) + FR-006 (rejeitar tag inválida).
Não duplicar lógica de tipo no cliente — o cliente recebe só as tags GASTOS do servidor.

---

## Decisão 7 — Exibição da tag no histórico unificado (query raw)

**Decisão**: incluir `tag_id` e `tag_name` no SELECT da query raw `listarTransacoesUnificadas`,
fazendo LEFT JOIN com a tabela `tags`.

**Rationale**: a função já usa `$queryRaw` por necessidade de UNION. Adicionar o JOIN mantém
a query unificada sem precisar de N+1 queries depois.

**Impacto**: o tipo `TransacaoUnificada` precisa de campos opcionais `tagId` e `tagNome`.

---

## NEEDS CLARIFICATION Resolvidos

| Item | Resolução |
|---|---|
| Relação 1:N ou N:M para gastos | 1:N (FK direta) — decisão 1 |
| Tipo do campo tipo | enum Prisma `TipoTag` — decisão 2 |
| Unique constraint com tipo? | Sim — decisão 3 |
| Comportamento ao deletar tag | SET NULL — decisão 4 |
| Tags globais vs. por família | Por família + seed — decisão 5 (aguarda validação) |
| Validação de tipo GASTOS | Servidor, na Server Action — decisão 6 |
| Tag no histórico unificado | LEFT JOIN na query raw — decisão 7 |
