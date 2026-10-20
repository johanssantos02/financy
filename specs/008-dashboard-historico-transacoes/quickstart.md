# Quickstart: Dashboard — Histórico de Transações

**Feature**: `008-dashboard-historico-transacoes` | **Date**: 2026-10-18

Guia de validação end-to-end para confirmar que a feature foi implementada corretamente.

---

## Pré-requisitos

- Aplicação rodando localmente: `npm run dev`
- Conta família com dados de teste (ver seção Dados de Teste abaixo)
- Acesso à rota `/dashboard` com usuário autenticado

---

## Dados de Teste

Inserir via seed ou manualmente na conta família do usuário de teste:

```
Gastos em dinheiro (DINHEIRO):
  - "Mercado Extra", R$ 150,00, hoje
  - "Farmácia ABC", R$ 45,00, ontem
  - "Padaria Dom Bosco", R$ 12,00, há 3 dias

Gastos em cartão (CARTAO):
  - "Netflix", R$ 55,90, hoje (com cartão cadastrado)
  - "Uber", R$ 23,00, há 2 dias

Despesas pagas (PagamentoDespesa):
  - "Aluguel", R$ 2.000,00, competência atual
  - "Internet Vivo", R$ 120,00, competência atual

Receita:
  - R$ 5.000,00, competência atual (para saldo positivo)
```

---

## Cenários de validação

### 1. Saldo exibido corretamente (FR-001, SC-001)

**Passo**: Abrir `/dashboard`
**Esperado**:
- Saldo visível no topo da tela em < 2s
- Valor = Receitas − Despesas pagas − Gastos = R$ 5.000 − R$ 2.120 − R$ 285,90 = R$ 2.594,10
- Saldo positivo: cor verde/primária
- Mês de competência indicado (ex: "outubro de 2026")

---

### 2. Lista unificada com os três tipos (FR-002, FR-003, FR-004, SC-002)

**Passo**: Verificar a lista de transações após carregar
**Esperado**:
- 7 itens visíveis (ou 7 se <= PAGE_SIZE de 20)
- Ordem decrescente por data de criação (item mais recente no topo)
- Cada item exibe: nome, valor (R$), data, badge/ícone do tipo
- Tipos visíveis: `GASTO_DINHEIRO`, `GASTO_CARTAO`, `DESPESA_PAGA`
- Nenhuma omissão ou duplicação

---

### 3. Drag-to-reveal em gasto dinheiro (FR-005, SC-004)

**Passo**: No item "Mercado Extra" (GASTO_DINHEIRO), deslizar para a esquerda
**Esperado**:
- Botões "Editar" e "Excluir" revelados em < 100ms após gesto completo
- Swipe parcial (< 80px): item retorna ao estado original

**Passo**: Tentar deslizar "Netflix" (GASTO_CARTAO) ou "Aluguel" (DESPESA_PAGA)
**Esperado**: Nenhuma ação revelada (SC-007)

---

### 4. Excluir gasto dinheiro (FR-006, SC-006)

**Passo**: Revelar ações de "Padaria Dom Bosco" → tocar "Excluir"
**Esperado**:
- Diálogo de confirmação exibido com nome e valor do gasto
- Após confirmar: item removido da lista
- Saldo atualizado na mesma tela sem recarregamento manual
- Após cancelar: item permanece na lista

---

### 5. Navegar para edição (FR-007)

**Passo**: Revelar ações de "Farmácia ABC" → tocar "Editar"
**Esperado**:
- Navegação para `/gastos/[id]/editar` com campos pré-preenchidos
- Campo nome = "Farmácia ABC", valor = "45,00"

---

### 6. Busca por nome (FR-009, SC-003)

**Passo**: Digitar "merc" no campo de busca
**Esperado**:
- Lista filtra em < 500ms após parar de digitar (debounce 400ms)
- Apenas "Mercado Extra" exibido
- URL atualizada: `/dashboard?busca=merc`

**Passo**: Limpar o campo de busca
**Esperado**: Todos os itens retornam

**Passo**: Digitar "xyzxyz" (sem resultado)
**Esperado**: Mensagem "Nenhuma transação encontrada para 'xyzxyz'"

---

### 7. Paginação (FR-010, FR-011, FR-012, SC-005)

**Pré-requisito**: Inserir > 20 transações na conta família
**Passo**: Abrir `/dashboard`
**Esperado**:
- Apenas 20 itens exibidos (PAGE_SIZE)
- Controles de paginação visíveis com página atual e total
- Botão "Próxima" navega para `/dashboard?pagina=2`
- Na última página, botão "Próxima" desabilitado/oculto

**Passo**: Com busca ativa retornando 25 resultados, navegar para página 2
**Esperado**: Página 2 do conjunto filtrado, sem repetição dos 20 anteriores (SC-005)

---

### 8. Estado vazio (FR-015)

**Pré-requisito**: Conta família sem transações
**Passo**: Abrir `/dashboard`
**Esperado**: Mensagem amigável orientando a registrar o primeiro gasto

---

### 9. Saldo zero e negativo

**Passo**: Conta com gastos > receitas
**Esperado**: Saldo em vermelho/destaque de atenção

**Passo**: Conta com gastos = receitas
**Esperado**: Saldo exibido como R$ 0,00, sem estilo positivo ou negativo

---

### 10. Viewport mobile (SC-008)

**Passo**: Abrir `/dashboard` em viewport 375px (DevTools mobile ou dispositivo real)
**Esperado**: Nenhum truncamento de nome, valor ou data; layout responsivo; drag-to-reveal funcional em touch

---

## Verificação técnica

```bash
# Lint e build devem passar sem erros
npm run lint
npm run build
```

---

## Referências

- Contratos de tipos: [contracts/TransacaoUnificada.ts](./contracts/TransacaoUnificada.ts)
- Modelo de dados: [data-model.md](./data-model.md)
- Decisões de design: [research.md](./research.md)
