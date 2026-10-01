# Quickstart: Tela de nova despesa

## Pré-requisitos

- Variáveis de ambiente do projeto configuradas (banco e Auth.js).
- Migrations aplicadas (`npx prisma migrate deploy`) e um usuário vinculado a uma conta família.
- `npm run dev` e login em `http://localhost:3000/login`.

## Verificações automáticas

```bash
npm run lint
npm run build
```

Ambos devem passar sem erros.

## Cenários manuais

Referências: [contrato da tela](./contracts/tela-nova-despesa.md), [data-model](./data-model.md).

1. **Navegação (US1)**: em `/despesas`, tocar no `+` do navbar → "Nova despesa". A URL deve ser
   `/despesas/nova?origem=%2Fdespesas` e a tela deve exibir título, descrição, aviso de obrigatórios,
   os cinco campos e os botões.
2. **Cadastro (US1)**: preencher nome "Internet", vencimento no mês atual, valor "129,90" e salvar.
   Esperado: toast de sucesso, retorno a `/despesas` e "Internet" listada sem recarregar.
3. **Recorrente (US1)**: cadastrar "Academia" recorrente e navegar para o mês seguinte em `/despesas`
   — deve aparecer também lá.
4. **Obrigatórios (US2)**: salvar com tudo vazio. Esperado: toast de erro, borda vermelha em nome,
   vencimento e valor, foco no nome, nenhuma navegação. Digitar no nome remove só o destaque dele.
5. **Valor inválido (US2)**: valor "0" e depois "12,345" → erro no valor com foco nele.
6. **Nome repetido (US2)**: cadastrar " INTERNET " → toast "Já existe uma despesa com este nome.",
   nome destacado e focado, valores preservados.
7. **Duplo clique (edge)**: tocar duas vezes rápido em "Salvar" com dados válidos → apenas uma despesa
   criada; botão mostra "Salvando…" desabilitado durante o envio.
8. **Cancelar (US3)**: abrir "Nova despesa" a partir do Início (`/dashboard`) e cancelar → volta ao
   Início; nada é criado.
9. **Acesso direto (US3)**: abrir `http://localhost:3000/despesas/nova` em nova aba, cancelar → vai para
   `/despesas`; o botão voltar do navegador não retorna ao formulário.
10. **Origem maliciosa**: abrir `/despesas/nova?origem=//exemplo.com` e cancelar → vai para
    `/despesas` (origem descartada).
11. **Acessibilidade**: executar os cenários 2, 4 e 8 só com teclado; leitor de tela anuncia campos
    inválidos com a mensagem.
