# Feature Specification: Dashboard — Histórico de Transações

**Feature Branch**: `008-dashboard-historico-transacoes`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "DASHBOARD - Tela de histórico de transações em Financy. Implementar dashboard com saldo + histórico unificado de transações (gastos dinheiro + despesas pagas + faturas cartão pagas), ordenação por data de criação decrescente, paginação, busca por nome, drag-to-reveal em gastos dinheiro com edit/delete."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar saldo e panorama financeiro do mês (Priority: P1)

O usuário abre o dashboard e visualiza imediatamente o saldo disponível da sua conta família referente
ao mês atual. O saldo é exibido com destaque no topo da tela, sem necessidade de qualquer interação
adicional. Mesmo ao rolar a lista de transações, o saldo permanece visível.

**Why this priority**: O saldo é a informação mais crítica do aplicativo — é a razão pela qual o
usuário abre o Financy. Qualquer outra funcionalidade do dashboard depende de que ele esteja visível.

**Independent Test**: Abrir o dashboard sem realizar nenhuma ação. Verificar que o saldo do mês
atual está exibido no topo, com valor numérico legível. O saldo deve ser idêntico ao calculado
somando todas as receitas e subtraindo todas as despesas pagas e todos os gastos do mês.

**Acceptance Scenarios**:

1. **Dado** que o usuário acessa o dashboard, **Quando** a tela carregar, **Então** o saldo do mês
   atual deve ser exibido no topo com o valor formatado em reais (R$) e indicação visual clara do
   mês de referência.
2. **Dado** que o saldo é negativo (gastos superam receitas), **Quando** o dashboard for exibido,
   **Então** o saldo deve ser apresentado em destaque visual diferenciado para indicar situação de
   atenção (ex: cor vermelha ou ícone de alerta).
3. **Dado** que o usuário registra um novo gasto ou receita em outra tela e retorna ao dashboard,
   **Quando** a tela for renderizada, **Então** o saldo deve refletir o novo estado, sem necessidade
   de recarregar manualmente.

---

### User Story 2 - Visualizar histórico unificado de todas as transações (Priority: P1)

O usuário vê em uma única lista cronológica todos os movimentos financeiros da conta família: gastos
pagos em dinheiro, gastos pagos no cartão de crédito e despesas recorrentes que foram pagas. Cada
item identifica claramente de qual tipo é (gasto dinheiro, gasto cartão ou despesa paga) e exibe o
nome, valor e data. Os itens mais recentes aparecem no topo da lista.

**Why this priority**: A lista unificada é o núcleo do dashboard — o que diferencia esta tela de
qualquer outra já existente no app. Sem ela o dashboard é apenas um placeholder.

**Independent Test**: Com pelo menos um gasto em dinheiro, um gasto no cartão e uma despesa paga
cadastrados, abrir o dashboard e verificar que os três aparecem na mesma lista, cada um com seu tipo
identificável, ordenados do mais recente para o mais antigo.

**Acceptance Scenarios**:

1. **Dado** que a conta família tem gastos em dinheiro, gastos em cartão e despesas pagas,
   **Quando** o dashboard for exibido, **Então** todos os três tipos devem aparecer na mesma lista,
   cada item com indicação visual do seu tipo (ex: ícone ou badge).
2. **Dado** que a lista contém transações de datas variadas, **Quando** o histórico for exibido,
   **Então** os itens devem estar ordenados pela data de criação em ordem decrescente (mais recente
   primeiro).
3. **Dado** que a conta família não tem nenhuma transação registrada, **Quando** o dashboard for
   exibido, **Então** deve ser apresentada uma mensagem de estado vazio amigável orientando o usuário
   a registrar seu primeiro gasto.
4. **Dado** que o usuário visualiza um item de despesa paga ou gasto de cartão, **Quando** tentar
   qualquer ação de edição, **Então** nenhuma opção de edição deve ser disponibilizada; esses itens
   são somente leitura.

---

### User Story 3 - Editar ou excluir um gasto em dinheiro (Priority: P1)

O usuário desliza horizontalmente um item de gasto em dinheiro para revelar as opções de edição e
exclusão. Ao escolher editar, é levado para a tela de edição preenchida com os dados do gasto. Ao
escolher excluir, confirma a ação em um diálogo de confirmação e o item desaparece da lista com o
saldo atualizado.

**Why this priority**: A mutabilidade exclusiva dos gastos em dinheiro é regra de negócio central
desta feature. Sem drag-to-reveal, o usuário não tem como corrigir erros de registro.

**Independent Test**: Com um gasto em dinheiro na lista, deslizar o item para a esquerda e verificar
que os botões "Editar" e "Excluir" são revelados. Clicar em "Excluir", confirmar e verificar que o
item é removido da lista e o saldo é atualizado.

**Acceptance Scenarios**:

1. **Dado** que existe um item de gasto em dinheiro na lista, **Quando** o usuário deslizar o item
   horizontalmente, **Então** as ações "Editar" e "Excluir" devem ser reveladas por baixo do item.
2. **Dado** que as ações estão reveladas, **Quando** o usuário tocar em "Editar", **Então** deve
   ser navegado para a tela de edição do gasto, com todos os campos preenchidos com os valores
   atuais.
3. **Dado** que as ações estão reveladas, **Quando** o usuário tocar em "Excluir", **Então** um
   diálogo de confirmação deve ser exibido com o nome do gasto e valor; somente após confirmar o
   item é removido e o saldo é recalculado.
4. **Dado** que o usuário inicia o arraste mas não o completa (arraste parcial), **Quando** soltar
   o item, **Então** o item deve volcar ao estado original sem expor as ações.
5. **Dado** que itens de despesa paga ou gasto de cartão estão na lista, **Quando** o usuário
   tentar deslizá-los, **Então** nenhuma ação de edição deve ser revelada.

---

### User Story 4 - Buscar transações por nome (Priority: P2)

O usuário digita um termo no campo de busca e a lista filtra em tempo real, exibindo apenas as
transações cujo nome contém o termo digitado (sem distinção de maiúsculas/minúsculas). Ao limpar o
campo de busca, a lista volta ao estado original completo.

**Why this priority**: Em contas com muitas transações a busca é essencial para localizar um item
específico. É uma funcionalidade de conforto, por isso P2.

**Independent Test**: Com pelo menos 5 transações de nomes distintos, digitar parte do nome de uma
delas no campo de busca e verificar que apenas os itens correspondentes são exibidos. Limpar o
campo e verificar que todos os itens retornam.

**Acceptance Scenarios**:

1. **Dado** que o campo de busca está vazio, **Quando** o usuário digitar um termo, **Então** a
   lista deve filtrar imediatamente mostrando apenas itens cujo nome contenha o termo, ignorando
   maiúsculas e minúsculas.
2. **Dado** que o campo de busca tem um termo ativo, **Quando** o usuário apagar o termo ou limpar
   o campo, **Então** todos os itens devem voltar a ser exibidos.
3. **Dado** que o termo digitado não corresponde a nenhum item, **Quando** a busca for realizada,
   **Então** uma mensagem de estado vazio específica para busca deve ser exibida (ex: "Nenhuma
   transação encontrada para '[termo]'").
4. **Dado** que a busca retorna resultados, **Quando** o usuário interagir com um item (ex: editar),
   **Então** as ações devem funcionar normalmente como se a busca não estivesse ativa.

---

### User Story 5 - Navegar por páginas de transações (Priority: P2)

Quando o histórico tem muitas transações, a lista exibe um conjunto limitado de itens por vez. O
usuário pode avançar e voltar entre as páginas através de controles de paginação. O número da página
atual e o total de itens são indicados visualmente.

**Why this priority**: Contas com histórico longo precisam de paginação para evitar lentidão e
degradação de experiência. É P2 pois depende do US1 e US2 estarem funcionando.

**Independent Test**: Com mais de 20 transações na conta, abrir o dashboard e verificar que apenas
um subconjunto é exibido. Navegar para a segunda página e verificar que itens diferentes são
exibidos, sem repetição.

**Acceptance Scenarios**:

1. **Dado** que o total de transações excede o limite por página, **Quando** o dashboard carregar,
   **Então** somente a primeira página deve ser exibida com controles de navegação visíveis.
2. **Dado** que os controles de paginação são visíveis, **Quando** o usuário avançar para a próxima
   página, **Então** o próximo conjunto de transações deve ser exibido sem repetição dos anteriores.
3. **Dado** que a busca está ativa e filtrou resultados, **Quando** a quantidade filtrada superar o
   limite por página, **Então** a paginação deve funcionar sobre o conjunto filtrado.
4. **Dado** que o usuário está na última página, **Quando** tentar avançar, **Então** o botão de
   próxima página deve estar desabilitado ou oculto.

---

### Edge Cases

- O que acontece quando a conta família não tem nenhuma transação? → Estado vazio amigável com CTA
  para registrar o primeiro gasto.
- O que acontece se o saldo for exatamente zero? → Exibir R$ 0,00 sem estilo de positivo ou negativo.
- O que acontece se a busca retornar resultados em múltiplas páginas? → Paginação deve atuar sobre
  o conjunto filtrado, não sobre o total.
- O que acontece se o usuário tentar arrastar um item de despesa/cartão? → Nenhuma ação é revelada;
  o item permanece imóvel ou retorna ao lugar.
- O que acontece se um gasto em dinheiro for editado enquanto estava visível na lista filtrada?
  → Após salvar, a lista deve refletir os dados atualizados.
- O que acontece quando o saldo do mês está sendo carregado? → Exibir estado de carregamento no
  lugar do valor para evitar layout shift.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir o saldo financeiro do mês atual da conta família no topo do
  dashboard, calculado como a diferença entre receitas e todas as saídas (gastos + despesas pagas)
  do mês.
- **FR-002**: O sistema DEVE exibir uma lista unificada de transações contendo três tipos:
  gastos pagos em dinheiro, gastos pagos em cartão de crédito e despesas recorrentes pagas.
- **FR-003**: A lista de transações DEVE ser ordenada pela data de criação do registro em ordem
  decrescente (mais recente primeiro).
- **FR-004**: Cada item da lista DEVE exibir: nome da transação, valor formatado em reais, data e
  indicador visual do tipo (gasto dinheiro / gasto cartão / despesa paga).
- **FR-005**: O sistema DEVE suportar a ação de arrastar horizontalmente (drag-to-reveal) apenas
  em itens do tipo "gasto em dinheiro", revelando botões de "Editar" e "Excluir".
- **FR-006**: A ação de exclusão de gasto em dinheiro DEVE exigir confirmação antes de remover o
  registro permanentemente.
- **FR-007**: A ação de edição de gasto em dinheiro DEVE navegar para a tela de edição do gasto com
  os campos pré-preenchidos.
- **FR-008**: Itens do tipo "despesa paga" e "gasto em cartão" DEVEM ser somente leitura; nenhuma
  ação de edição ou exclusão pode ser exposta para esses tipos.
- **FR-009**: O sistema DEVE disponibilizar um campo de busca que filtre a lista por nome da
  transação de forma insensível a maiúsculas/minúsculas.
- **FR-010**: A lista de transações DEVE ser paginada, exibindo um número fixo de itens por página
  (padrão: 20 itens).
- **FR-011**: Os controles de paginação DEVEM indicar a página atual e permitir navegar para a
  próxima e para a página anterior.
- **FR-012**: A paginação DEVE funcionar corretamente quando combinada com a busca ativa, paginando
  sobre o conjunto filtrado.
- **FR-013**: O saldo DEVE permanecer visível no topo da tela mesmo durante a rolagem da lista de
  transações.
- **FR-014**: O sistema DEVE exibir estado de carregamento adequado enquanto os dados são
  recuperados do servidor.
- **FR-015**: O sistema DEVE exibir estado vazio quando não há transações (ou quando a busca não
  retorna resultados), com mensagem orientativa.

### Key Entities *(include if feature involves data)*

- **Transação (conceito unificado)**: Representação normalizada de qualquer movimento financeiro
  de saída. Possui identificador único, nome, valor, tipo (GASTO_DINHEIRO / GASTO_CARTAO /
  DESPESA_PAGA), data de criação e uma flag indicando se é editável. Não existe como tabela
  própria — é resultado de uma consulta unificada sobre Gasto e PagamentoDespesa.
- **Gasto**: Registro de um gasto avulso da conta família. Pode ser pago em dinheiro ou cartão.
  Os gastos em dinheiro são mutáveis nesta tela; os de cartão são somente leitura.
- **PagamentoDespesa**: Registro de que uma despesa recorrente foi paga em determinada competência.
  Sempre somente leitura nesta tela.
- **Saldo do Mês**: Valor calculado como receitas do mês menos despesas pagas menos gastos do mês.
  Não é persistido — é derivado a cada acesso.
- **ContaFamilia**: Escopo de todos os dados. Toda consulta é restrita à conta família do usuário
  autenticado; o sistema nunca expõe dados de outras contas.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O saldo do mês deve ser exibido em menos de 2 segundos após o usuário abrir o
  dashboard em condições normais de rede.
- **SC-002**: A lista unificada deve exibir corretamente os três tipos de transação sem omissão
  ou duplicação — verificável comparando o total de itens da lista com a soma de registros nos
  três tipos de origem.
- **SC-003**: A busca por nome deve filtrar resultados em menos de 500 ms após o usuário parar
  de digitar, sem recarregamento de página.
- **SC-004**: A ação de drag-to-reveal deve responder ao gesto em menos de 100 ms, sem
  travamentos ou saltos visuais perceptíveis.
- **SC-005**: A paginação deve navegar entre páginas sem perda de contexto (ex: a busca ativa
  é preservada ao mudar de página).
- **SC-006**: Após excluir um gasto em dinheiro, o saldo deve ser atualizado na mesma tela sem
  necessidade de recarregamento manual.
- **SC-007**: 100% dos itens de tipo despesa paga e gasto cartão não devem expor nenhum controle
  de edição ou exclusão em nenhuma circunstância.
- **SC-008**: A tela deve ser utilizável em dispositivos móveis com tela de 375 px de largura
  (viewport mínimo alvo do Financy), sem truncamento de informação crítica.

---

## Assumptions

- O saldo exibido é sempre o do **mês atual** (competência corrente), seguindo o padrão já
  estabelecido pelo cálculo existente no Financy. Não há seletor de período nesta versão.
- "Faturas cartão pagas" refere-se a registros do modelo `Gasto` com `formaPagamento = CARTAO` —
  não a uma entidade de fatura separada, pois o schema atual não possui tal entidade.
- "Despesas pagas" refere-se a registros do modelo `PagamentoDespesa` (tabela `expense_payments`),
  que representa o ato de pagamento de uma despesa recorrente em uma competência.
- O limite padrão de itens por página é 20. Este valor pode ser ajustado na fase de planejamento
  técnico se houver indicação de volume de dados diferente.
- A tela de edição de gasto em dinheiro já existe ou será construída em outra feature; esta spec
  não cobre a implementação da tela de edição em si — apenas a navegação até ela.
- O drag-to-reveal é um gesto nativo mobile (touch). Em desktop, as ações podem ser expostas por
  um menu de contexto ou hover, a ser definido na fase de design/planejamento.
- Gastos em cartão são somente leitura nesta tela porque modificar um gasto de cartão pode afetar
  o limite do cartão de forma não trivial; a edição desses itens fica para uma feature específica
  de gerenciamento de faturas.
- Não há filtro por período ou tipo de transação nesta versão — apenas busca por nome.
- A conta família do usuário autenticado é sempre obtida do servidor a partir da sessão; nunca
  é informada pelo cliente.
