# Quickstart: Validação end-to-end — Modal de Criar Gasto

## Pré-requisitos

- Aplicação rodando localmente: `npm run dev`
- Banco com migration aplicada: `npx prisma migrate dev`
- Usuário autenticado com conta família que possui pelo menos um cartão cadastrado
- Cartão com limite total ≥ R$ 500,00 e `limiteUsado = 0`

---

## Cenário 1 — Gasto com dinheiro (fluxo feliz)

1. Navegar para `/despesas`
2. Acionar o botão "+" ou "Novo gasto"
3. Preencher:
   - **Nome**: "Mercado"
   - **Valor**: `150,00`
   - **Forma de pagamento**: Dinheiro
   - **Data**: hoje (pré-preenchida)
4. Confirmar

**Resultado esperado**:
- Modal fecha com toast "Gasto registrado."
- Novo item aparece na lista de gastos sem recarregar a página
- Saldo da família reduz em R$ 150,00

**Verificação no banco**:
```sql
SELECT * FROM spending_records ORDER BY created_at DESC LIMIT 1;
-- payment_method = 'cash', amount = 150.00
```

---

## Cenário 2 — Gasto com cartão dentro do limite

1. Abrir modal de novo gasto
2. Preencher:
   - **Nome**: "Restaurante"
   - **Valor**: `400,00`
   - **Forma de pagamento**: Cartão → selecionar o cartão (limite R$ 500,00)
   - **Data**: hoje
3. Confirmar

**Resultado esperado**:
- Modal fecha com toast de sucesso
- `CartaoCredito.limiteUsado` = R$ 400,00

**Verificação no banco**:
```sql
SELECT used_limit FROM credit_cards WHERE id = '<cartaoId>';
-- 400.00
```

---

## Cenário 3 — Gasto com cartão acima do limite

1. Com o cartão já em R$ 400,00 usados (limite R$ 500,00)
2. Abrir modal, preencher valor `200,00` no mesmo cartão
3. Confirmar

**Resultado esperado**:
- Modal permanece aberto
- Toast de erro: "Limite disponível insuficiente. Disponível: R$ 100,00."
- `CartaoCredito.limiteUsado` permanece R$ 400,00

---

## Cenário 4 — Validação de campos

| Ação | Campo inválido | Mensagem esperada |
|---|---|---|
| Nome "Ab" | nome | "O nome deve ter pelo menos 3 caracteres." |
| Valor `0` | valor | "O valor deve ser maior que zero." |
| Forma "Cartão" sem selecionar | cartaoId | "Selecione um cartão." |
| Cancelar / clicar fora | — | Modal fecha, nenhum dado registrado |

---

## Cenário 5 — Sem cartões cadastrados

1. Usuário sem nenhum cartão na conta família
2. Abrir modal → selecionar "Cartão"

**Resultado esperado**:
- Mensagem informativa: "Nenhum cartão cadastrado. Adicione um em Cartões."
- Botão de confirmar desabilitado

---

## Cenário 6 — Concorrência (dois gastos simultâneos no mesmo cartão)

Simular via dois terminais com `curl` ou dois clientes browser logados na mesma conta família, ambos enviando R$ 350,00 para um cartão com limite R$ 500,00 (limiteUsado = 0):

**Resultado esperado**:
- Exatamente um gasto é aceito (R$ 350,00)
- O segundo recebe erro de limite excedido
- `CartaoCredito.limiteUsado` = R$ 350,00 (nunca R$ 700,00)

**Verificação no banco**:
```sql
SELECT COUNT(*) FROM spending_records WHERE credit_card_id = '<cartaoId>';
-- 1

SELECT used_limit FROM credit_cards WHERE id = '<cartaoId>';
-- 350.00
```

---

## Checklist de build

```bash
npm run lint    # sem erros
npm run build   # sem erros de tipo ou compilação
```
