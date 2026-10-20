# Research: Modal de Criar Gasto

## Decisão 1: `Gasto` como entidade separada de `Despesa`

**Decisão**: Criar modelo `Gasto` independente; não reutilizar `Despesa` + `PagamentoDespesa`.

**Rationale**: `Despesa` representa conta a pagar com vencimento, recorrência e competência mensal — semântica de obrigação financeira. `Gasto` representa transação pontual de consumo com forma de pagamento explícita (dinheiro ou cartão). Misturar os dois contamina a semântica do domínio e quebraria regras de negócio existentes (ex.: `PagamentoDespesa.competencia` seria inútil para um gasto pontual).

**Alternativas consideradas**:
- Reutilizar `Despesa` com campo extra `formaPagamento` → rejeitado: acoplaria regras de recorrência e competência a gastos pontuais.
- Usar `PagamentoDespesa` como registro do gasto → rejeitado: `PagamentoDespesa` é vínculo entre uma despesa existente e o mês pago, não uma entidade de gasto independente.

---

## Decisão 2: `limiteUsado` como coluna explícita em `CartaoCredito`

**Decisão**: Adicionar coluna `limite_usado DECIMAL(12,2) NOT NULL DEFAULT 0` ao modelo `CartaoCredito`.

**Rationale**: A especificação exige `SELECT … FOR UPDATE` na linha do cartão para garantir integridade sob concorrência (FR-012). Isso requer que o limite utilizado esteja na mesma linha bloqueada. Uma abordagem computada (`SUM(gastos WHERE cartaoId = X)`) forçaria o bloqueio de múltiplas linhas da tabela de gastos, aumentando a probabilidade de deadlocks e tornando o bloqueio pessimista impraticável.

O comentário existente em `src/entities/cartao/api/consultas.ts` já antecipava esse campo: `"limiteUsado é sempre '0.00' nesta entrega — será calculado quando existir vínculo com compras"`.

**Alternativas consideradas**:
- Computar via `SUM(gastos)` → rejeitado: impossibilita SELECT FOR UPDATE eficiente na linha do cartão.
- Coluna `limiteDisponivel` em vez de `limiteUsado` → rejeitado: `limite - limiteUsado` é trivial de computar; armazenar o utilizado preserva a fonte de verdade (limite total pode mudar).

---

## Decisão 3: Saldo da conta família permanece computado

**Decisão**: Não adicionar coluna `saldo` a `ContaFamilia`. Estender `obterSaldoMes` para subtrair gastos.

**Rationale**: A spec permite saldo negativo para pagamentos em dinheiro (edge case explícito nas Assumptions). Um saldo mutável explícito exigiria locks em toda criação de gasto de qualquer forma de pagamento, mesmo sem restrição de limite — complexidade desnecessária. A abordagem computada é consistente com o padrão existente e não tem overhead perceptível para a escala atual (membros de uma conta família).

**Fórmula atualizada**:
```
saldo_mês = SUM(receitas da competência) - SUM(despesas pagas na competência) - SUM(gastos do mês)
```

**Alternativas consideradas**:
- Coluna `saldo` com trigger ou atualização no Server Action → rejeitado: complexidade operacional sem ganho de consistência para o caso de dinheiro (sem restrição de limite).

---

## Decisão 4: Modal como Client Component com `<dialog>` nativo / primitiva Radix

**Decisão**: Implementar o modal como Client Component usando um `<dialog>` gerenciado por estado React (ou primitiva headless já presente no projeto).

**Rationale**: A spec exige fechar ao clicar fora (FR-016) e focus management (FR-003). Intercepting routes do Next.js resolveriam deep-linking mas adicionariam complexidade desnecessária para um modal sem URL própria. Um Client Component simples com `useRef<HTMLDialogElement>` (ou a primitiva headless já usada no projeto) satisfaz todos os requisitos com menor superfície de código.

**Alternativas consideradas**:
- Intercepting routes (`@modal`) → rejeitado: feature não exige URL própria; complexidade desproporcional.
- Separate page with sheet/drawer → rejeitado: spec define explicitamente "modal".

---

## Decisão 5: SELECT FOR UPDATE via `$queryRaw` do Prisma

**Decisão**: Usar `clientePrisma.$queryRaw` dentro de `$transaction` para executar `SELECT … FOR UPDATE` na linha do cartão.

**Rationale**: Prisma ORM 7 não expõe cláusula `FOR UPDATE` na API de alto nível (`findFirst`, `findUnique`). A forma suportada é via `$queryRaw` dentro de uma transação interativa. Isso é consistente com o padrão já usado no projeto para operações que o Prisma Client não cobre nativamente.

```typescript
const [cartao] = await tx.$queryRaw<{ limite: string; limiteUsado: string }[]>`
  SELECT limite, limite_usado AS "limiteUsado"
  FROM credit_cards
  WHERE id = ${cartaoId}::uuid
    AND family_account_id = ${contaFamiliaId}::uuid
  FOR UPDATE
`;
```

**Alternativas consideradas**:
- `$executeRaw` → rejeitado: não retorna dados; precisaríamos de dois round-trips.
- Optimistic concurrency (version field) → rejeitado: spec exige explicitamente bloqueio pessimista.

---

## Decisão 6: Forma de pagamento como enum Prisma

**Decisão**: Criar enum `FormaPagamento { DINHEIRO, CARTAO }` no schema Prisma (mapeado para `payment_methods` no PostgreSQL).

**Rationale**: Consistente com os enums existentes (`UserRole`, `MembroFuncao`, `TipoReceita`). Enum nativo no banco garante integridade referencial sem verificação adicional na aplicação.

**Alternativas consideradas**:
- String livre com validação Zod → rejeitado: perde a checagem de integridade no banco.
- Boolean `usouCartao` → rejeitado: pouco expressivo; dificulta extensão futura (ex.: Pix, débito).
