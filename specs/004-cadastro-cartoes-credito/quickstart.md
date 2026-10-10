# Quickstart: validar o cadastro de cartões de crédito

## Pré-requisitos

- `.env` com `DATABASE_URL` e `DIRECT_URL` válidos.
- Dois usuários em famílias diferentes (ex.: a família Johan/Vivih das migrations de seed e um usuário de
  outra família) e ao menos um usuário com `role = admin` e outro com `role = user` na mesma família.

## Setup

```bash
npm install
npm run prisma:validar
npm run db:migrar          # aplica <timestamp>_criar_cartoes_credito
npm run dev
```

Conferir que a migration contém apenas `credit_cards` (tabela, índice único, FK `RESTRICT` e 3 CHECKs) e
que as contagens de `expenses`, `expense_payments`, `tags` e `family_accounts` não mudaram.

## Verificações automáticas

```bash
npm test         # Vitest: schemas, actions (autorização/isolamento) e formulário
npm run lint
npm run build
```

## Cenários manuais (celular ou DevTools a 375 px, depois 1440 px)

1. **Entrada**: abrir "Mais opções" → "Cartões" → chega em `/cartoes`. Família sem cartões → estado vazio
   com CTA. (US3)
2. **Cadastro**: CTA/"Novo cartão" → `/cartoes/novo`; prévia muda ao digitar; salvar "Nubank", "Nu
   Pagamentos", R$ 5.000,00, 3, 10 → toast de sucesso, volta à lista com o cartão mostrando limite usado
   R$ 0,00 e total R$ 5.000,00. (US1, SC-001, SC-004)
3. **Duplo toque**: tocar "Salvar" várias vezes rápido → um único cartão. (SC-005)
4. **Erros**: nome vazio, instituição só com espaços, limite 0, dia 0 e 32, nome "nubank " repetido → cada
   caso mostra mensagem, borda vermelha, foco no campo e mantém os demais valores. (US2)
5. **Edição**: "Editar" abre com valores atuais; alterar limite → lista atualizada. Abrir
   `/cartoes/<id-de-outra-família>/editar` → página não encontrada. (US4, SC-003)
6. **Exclusão (admin)**: "Excluir" → cancelar (nada muda) → confirmar → cartão some, toast de sucesso;
   despesas/pagamentos intactos. (US5, SC-008)
7. **Exclusão (não admin)**: botão não aparece. (FR-023)
8. **Isolamento**: logado na outra família, `/cartoes` não lista os cartões da primeira. (SC-003)
9. **Dados sensíveis**: inspecionar formulário e tabela `credit_cards` — nenhum campo de número, CVV,
   validade ou titular. (SC-007)
10. **Responsivo**: sem rolagem horizontal de 320 px a 1440 px; navegação completa por teclado, diálogo de
    confirmação com foco preso e Esc fechando. (SC-006, FR-034)
11. **Integridade**: tentar excluir a conta família com cartões (via SQL) → bloqueado pela FK. (FR-027)
