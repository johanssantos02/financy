# Research: Gerenciamento de Receitas/Entradas

**Feature**: `005-crud-receitas` | **Date**: 2026-10-13

## Decisão 1 — Padrão de UI para cadastro e edição

**Decision**: `<dialog>` nativo (bottom-sheet no mobile, centralizado no desktop) renderizado na página `/entradas`, sem rota separada para cadastro ou edição.

**Rationale**: A spec exige "modal" e referencia a interação visual do botão "+" do footer. O projeto já tem este padrão implementado em `OpcoesDespesa` (componente `<dialog>` com `showModal()`, backdrop e `fecharAoClicarFora`). Reutilizar o padrão evita duplicação e garante consistência. Uma rota `/entradas/nova` seria uma página separada — o padrão de despesas — mas a spec diferencia claramente "modal" do fluxo de página.

**Alternatives considered**:
- Rota `/entradas/nova` como página full-screen (padrão de `despesas/nova`): rejeitado porque contradiz o "modal" especificado.
- Next.js parallel routes (`@modal`): rejeitado por adicionar complexidade desnecessária sem ganho real neste contexto.

## Decisão 2 — Ponto de entrada pelo footer

**Decision**: Atualizar `MenuAcoes` de `rota: "/entradas/nova"` para `rota: "/entradas"`. A página `/entradas` já expõe o botão "Nova entrada" que abre o modal.

**Rationale**: O modal vive na página de lista, então navegar para `/entradas/nova` não faz sentido. A rota `/entradas` é o destino correto. Sem rota `/entradas/nova` no App Router.

**Alternatives considered**:
- Manter `/entradas/nova` e redirecionar para `/entradas`: indireção desnecessária.
- Passar callback `onNovaEntrada` pelo layout até `MenuAcoes`: acoplamento excessivo entre widget e layout.

## Decisão 3 — Armazenamento de competência

**Decision**: Competência armazenada como `DateTime @db.Date` com valor `<AAAA-MM>-01T00:00:00.000Z` (UTC). Circula como string `AAAA-MM` entre cliente e servidor. Conversão via `paraDataBanco(inicioDaCompetencia(competencia))` — funções já existentes em `shared/lib/datas`.

**Rationale**: Exatamente o mesmo padrão de `PagamentoDespesa.competencia` (campo `reference_month @db.Date`). Armazenar como `DATE` com dia fixo em UTC garante que a competência selecionada nunca mude por fuso horário (meia-noite UTC = ainda dia 1 do mês em qualquer fuso). Alternativa `VARCHAR` perderia indexação e quebra convenção.

**Alternatives considered**:
- Campo `VARCHAR(7)` com `AAAA-MM`: perde indexação temporal; incompatível com funções de data.
- `AAAA-MM-15` (meio do mês): sem vantagem e inconsistente com `PagamentoDespesa`.

## Decisão 4 — Exclusão física vs lógica

**Decision**: Exclusão física (`deleteMany` com `where: { id, contaFamiliaId }`), igual ao padrão de `CartaoCredito`.

**Rationale**: A spec não menciona histórico nem auditoria de receitas excluídas. A exclusão lógica de `Despesa` existe porque a recorrência precisa manter histórico de competências passadas. Receitas não têm recorrência calculada, portanto exclusão física é suficiente.

**Alternatives considered**:
- Exclusão lógica com `excluidoEm`: necessária apenas se houver histórico ou recorrência — fora do escopo da spec.

## Decisão 5 — Tipo como enum Prisma vs string

**Decision**: `enum TipoReceita { SALARIO OUTRO }` no schema Prisma, mapeado para `income_types` em SQL.

**Rationale**: `UserRole` e `MembroFuncao` já usam enum Prisma. É o padrão consolidado no projeto. Garante type-safety em tempo de compilação e constraint de banco sem lógica extra.

**Alternatives considered**:
- Campo `String` com `CHECK (type IN ('salary', 'other'))`: funcional mas perde type-safety Prisma e quebra convenção.

## Decisão 6 — Validação condicional de competência

**Decision**: Usar `z.superRefine` no schema Prisma para validar que competência é obrigatória quando `tipo === "SALARIO"` e deve ser `null` quando `tipo === "OUTRO"`. O schema de edição valida o estado final completo (não patches parciais).

**Rationale**: A spec exige validação no cliente e no servidor com a mesma lógica. `superRefine` permite validação cross-field no Zod, mantendo um único schema reutilizável em ambos os lados. O schema de edição valida o formulário inteiro (não apenas campos alterados) porque FR-012 exige "validar o resultado final dos dados".

**Alternatives considered**:
- Validação condicional manual no servidor fora do Zod: duplica lógica com o cliente.
- Schema parcial para edição (campos opcionais): poderia salvar estado inválido se os campos omitidos já estivessem incorretos.
