# Data Model: Modal de Criar Gasto

## Entidades afetadas

### 1. Novo enum `FormaPagamento`

```prisma
enum FormaPagamento {
  DINHEIRO @map("cash")
  CARTAO   @map("credit_card")

  @@map("payment_methods")
}
```

**Migration SQL**:
```sql
CREATE TYPE payment_methods AS ENUM ('cash', 'credit_card');
```

---

### 2. Novo modelo `Gasto`

```prisma
model Gasto {
  id             String        @id @default(uuid()) @db.Uuid
  contaFamilia   ContaFamilia  @relation(fields: [contaFamiliaId], references: [id], onDelete: Restrict)
  contaFamiliaId String        @map("family_account_id") @db.Uuid
  criadoPor      User          @relation("GastoCriadoPor", fields: [criadoPorId], references: [id])
  criadoPorId    String        @map("created_by") @db.Uuid
  nome           String        @map("name")
  valor          Decimal       @map("amount") @db.Decimal(12, 2)
  formaPagamento FormaPagamento @map("payment_method")
  cartao         CartaoCredito? @relation(fields: [cartaoId], references: [id], onDelete: Restrict)
  cartaoId       String?       @map("credit_card_id") @db.Uuid
  data           DateTime      @map("date") @db.Date
  criadoEm      DateTime      @default(now()) @map("created_at") @db.Timestamptz(3)
  atualizadoEm  DateTime      @updatedAt @map("updated_at") @db.Timestamptz(3)

  @@index([contaFamiliaId, data])
  @@map("spending_records")
}
```

**Regras de integridade**:
- `cartaoId` é obrigatório quando `formaPagamento = CARTAO`; proibido quando `DINHEIRO`
- `valor > 0` (validado no Zod antes de chegar ao banco)
- `nome` mínimo 3 caracteres (validado no Zod)

**Migration SQL**:
```sql
CREATE TABLE spending_records (
  id              UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_account_id UUID        NOT NULL REFERENCES family_accounts(id),
  created_by      UUID          NOT NULL REFERENCES users(id),
  name            TEXT          NOT NULL,
  amount          DECIMAL(12,2) NOT NULL,
  payment_method  payment_methods NOT NULL,
  credit_card_id  UUID          REFERENCES credit_cards(id),
  date            DATE          NOT NULL,
  created_at      TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ(3) NOT NULL
);

CREATE INDEX spending_records_family_date_idx
  ON spending_records (family_account_id, date);
```

---

### 3. Alteração em `CartaoCredito` — adicionar `limiteUsado`

```prisma
// Acrescentar ao modelo CartaoCredito existente:
limiteUsado  Decimal  @default(0) @map("used_limit") @db.Decimal(12, 2)
```

**Invariante**: `0 ≤ limiteUsado ≤ limite`

**Migration SQL**:
```sql
ALTER TABLE credit_cards
  ADD COLUMN used_limit DECIMAL(12, 2) NOT NULL DEFAULT 0;
```

---

### 4. Relações adicionadas a modelos existentes

```prisma
// Em User — acrescentar:
gastosCriados  Gasto[]  @relation("GastoCriadoPor")

// Em ContaFamilia — acrescentar:
gastos  Gasto[]

// Em CartaoCredito — acrescentar:
gastos  Gasto[]
```

---

## Diagrama de relações (texto)

```
ContaFamilia 1──N Gasto N──1(opcional) CartaoCredito
ContaFamilia 1──N CartaoCredito
User         1──N Gasto
```

---

## Transições de estado: criação de `Gasto` com cartão

```
[inicial]
  CartaoCredito.limiteUsado = L
  ContaFamilia.saldoComputado = S (calculado)

[SELECT FOR UPDATE na linha do cartão]
  Verifica: L + valor ≤ CartaoCredito.limite
  → Se não: ROLLBACK → retornar LIMITE_EXCEDIDO

[COMMIT]
  Gasto criado com cartaoId preenchido
  CartaoCredito.limiteUsado = L + valor
  saldoComputado passa a refletir o novo gasto automaticamente
```

---

## Cálculo de saldo atualizado

`obterSaldoMes` deve ser atualizado para:

```
saldo_mês(competência) =
  SUM(Receita WHERE competencia = início_do_mês OR competencia IS NULL)
  - SUM(Despesa WHERE algum PagamentoDespesa.competencia = início_do_mês)
  - SUM(Gasto WHERE data BETWEEN início_do_mês AND fim_do_mês)
```

Todos os `SUM` filtram pelo `contaFamiliaId`.
