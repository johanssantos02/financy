# Quickstart: validação do CRUD de Despesas

## Pré-requisitos

- `.env` com `DATABASE_URL` e `DIRECT_URL` do Supabase.
- Dependências instaladas (`npm install`, inclui `react-hot-toast`).
- Migration aplicada: `npm run prisma:validar && npm run db:migrar`.
- Dois usuários na mesma conta família (um `ADMIN`, um `USER`). Se não houver conta família, criá-la
  e associar os usuários via `npm run db:studio` (`family_accounts` / `user_family_accounts`).

## Dados de teste (via `db:studio` ou script local, na conta família)

Considerando hoje = D:

| Nome | Vencimento | Recorrente | Pagamento no mês atual |
| --- | --- | --- | --- |
| Aluguel | dia 10 do mês de D−2 meses | sim | sim |
| Internet | D + 3 | não | não |
| Academia | D − 2 | não | não |
| Mercado | D + 15 | não | não |
| Seguro | dia 31 do mês inicial | sim | não |

## Cenários

1. **Navbar** — tocar o 2º ícone → abre `/despesas`, ícone ativo (FR-015).
2. **Grupos e ordem** — Vencidas: Academia (vermelho); Abertas: Internet ("Vence em 3 dias"),
   Mercado; Pagas: Aluguel com opacidade reduzida (US1, FR-017..019).
3. **Skeleton** — throttle "Slow 4G" no DevTools e recarregar: esqueleto visível; aplicar um
   filtro também mostra o esqueleto (FR-026).
4. **Recorrência** — filtro mês = próximo mês: Aluguel em aberto com vencimento dia 10; Seguro com
   vencimento no último dia se o mês tiver < 31 dias; Internet/Academia/Mercado ausentes (US3).
   Mês anterior: Aluguel sem pagamento aparece como vencido.
5. **Busca** — `alug` + lupa → só Aluguel; campo vazio + lupa → lista completa (US2).
6. **Filtros** — situação = vencida + recorrente = não → indicador "2"; tocar o "x" → indicador
   some, lista volta completa e o termo de busca é mantido; recarregar a página preserva estado.
7. **URL inválida** — `/despesas?mes=abc&situacao=xyz` → lista do mês atual sem erro.
8. **Regras no servidor** — invocar as ações de `src/features/despesas` (ex.: página temporária
   de teste ou chamada em script de dev) e conferir retornos conforme
   [contracts/acoes-despesa.md](./contracts/acoes-despesa.md):
   - criar sem nome/valor/vencimento → 400 `VALIDACAO` com `campos`;
   - criar " aluguel " → 409 `CONFLITO`;
   - marcar Aluguel pago no mês atual → 409 `CONFLITO`;
   - usuário USER desmarca pagamento feito pelo ADMIN → sucesso;
   - USER exclui → 403 `SEM_PERMISSAO`; ADMIN exclui Mercado → sucesso e item some;
   - sem sessão → 401 `NAO_AUTENTICADO`.
9. **Toast** — forçar erro na listagem (ex.: `DATABASE_URL` inválida em dev) → estado de erro na
   tela + toast com mensagem genérica, sem detalhes do banco.
10. **Isolamento** — usuário de outra conta família não vê as despesas acima.

## Verificações obrigatórias

```bash
npm run lint
npm run build
```
