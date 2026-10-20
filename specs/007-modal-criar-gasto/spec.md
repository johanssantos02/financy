# Feature Specification: Modal de Criar Gasto

**Feature Branch**: `007-modal-criar-gasto`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "Implementar modal de criar gasto em Financy. Campos: nome (min 3 chars), valor, forma de pagamento (cartão/dinheiro), data (default hoje), validar limite cartão. Deve reduzir saldo família e cartão, tratar concorrência via SQL. Responda em português estruturado."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar um gasto com dinheiro (Priority: P1)

O usuário abre o modal de criar gasto a partir da tela de despesas ou do dashboard, preenche o nome do
gasto (mínimo 3 caracteres), o valor, seleciona "Dinheiro" como forma de pagamento e confirma a data
(padrão: hoje). Ao confirmar, o gasto é registrado, o saldo disponível da conta família é reduzido pelo
valor informado e o modal é fechado com feedback de sucesso.

**Why this priority**: É o fluxo mais comum e o mínimo para que o modal entregue valor. Sem ele não há
razão de existir.

**Independent Test**: Abrir o modal, preencher nome ("Mercado"), valor (R$ 150,00), forma de pagamento
"Dinheiro", data padrão e confirmar. Verificar que o gasto aparece na listagem e que o saldo da família
foi reduzido em R$ 150,00.

**Acceptance Scenarios**:

1. **Dado** que o usuário está na tela de despesas, **Quando** acionar o botão de novo gasto, **Então**
   o modal deve ser exibido com os campos nome, valor, forma de pagamento e data; a data deve já estar
   preenchida com a data de hoje.
2. **Dado** que todos os campos obrigatórios estão preenchidos com valores válidos e a forma de
   pagamento é "Dinheiro", **Quando** o usuário confirmar, **Então** o gasto deve ser registrado na
   conta família, o saldo disponível deve ser reduzido pelo valor exato informado e o modal deve fechar
   com uma notificação de sucesso.
3. **Dado** que o modal foi fechado com sucesso, **Quando** a listagem de gastos for exibida,
   **Então** o novo gasto deve aparecer sem necessidade de recarregar a página.

---

### User Story 2 - Registrar um gasto com cartão de crédito (Priority: P1)

O usuário seleciona "Cartão" como forma de pagamento e escolhe um dos seus cartões cadastrados. Antes
de confirmar, o sistema verifica se o valor do gasto cabe no limite disponível do cartão selecionado.
Se couber, o gasto é registrado, o limite utilizado do cartão é atualizado e o saldo da família é
reduzido. Se não couber, o usuário é informado e o registro não acontece.

**Why this priority**: A validação de limite é requisito explícito e parte central do valor de
negócio; sem ela gastos poderiam ultrapassar o limite do cartão silenciosamente.

**Independent Test**: Com um cartão cujo limite disponível seja R$ 500,00, tentar registrar um gasto
de R$ 600,00 e verificar que o sistema bloqueia e informa o motivo. Em seguida registrar um gasto de
R$ 400,00 e verificar que o limite utilizado do cartão aumenta R$ 400,00 e o saldo da família reduz
R$ 400,00.

**Acceptance Scenarios**:

1. **Dado** que a forma de pagamento é "Cartão", **Quando** o usuário selecionar essa opção,
   **Então** deve aparecer uma lista dos cartões cadastrados na conta família para escolha.
2. **Dado** que o valor do gasto é menor ou igual ao limite disponível do cartão selecionado,
   **Quando** o usuário confirmar, **Então** o gasto deve ser registrado, o limite utilizado do cartão
   deve ser incrementado pelo valor exato e o saldo da família deve ser reduzido pelo mesmo valor.
3. **Dado** que o valor do gasto excede o limite disponível do cartão selecionado, **Quando** o
   usuário tentar confirmar, **Então** o sistema deve exibir uma notificação de erro informando o limite
   disponível e nenhum dado deve ser alterado.
4. **Dado** que dois gastos são submetidos simultaneamente para o mesmo cartão, **Quando** ambos
   forem processados, **Então** apenas o(s) que couber(em) no limite disponível deve(m) ser registrado(s);
   o limite nunca deve ser ultrapassado, mesmo sob carga concorrente.

---

### User Story 3 - Receber orientação quando há erro no preenchimento (Priority: P1)

O usuário tenta confirmar um gasto com algum campo inválido: nome com menos de 3 caracteres, valor
zero ou negativo, data em formato inválido ou cartão não selecionado. O sistema não registra nada,
exibe uma notificação de erro clara e destaca o campo que precisa de correção com foco automático.

**Why this priority**: Erros de preenchimento são esperados; sem retorno claro o usuário não consegue
concluir o registro.

**Independent Test**: Tentar confirmar com nome "Ab", depois com valor R$ 0,00, depois com cartão não
selecionado — verificar em cada caso que nenhum dado é registrado, que o campo inválido recebe destaque
e foco, e que a notificação descreve o problema.

**Acceptance Scenarios**:

1. **Dado** que o nome tem menos de 3 caracteres, **Quando** o usuário tentar confirmar,
   **Então** o campo nome deve ser destacado como inválido, receber o foco e exibir a mensagem
   "O nome deve ter pelo menos 3 caracteres", sem registrar nada.
2. **Dado** que o valor é zero, negativo ou não numérico, **Quando** o usuário tentar confirmar,
   **Então** o campo valor deve ser destacado como inválido com mensagem apropriada e receber o foco.
3. **Dado** que a forma de pagamento é "Cartão" mas nenhum cartão foi selecionado, **Quando** o
   usuário tentar confirmar, **Então** o seletor de cartão deve ser destacado como inválido e receber
   o foco.
4. **Dado** que um campo está destacado como inválido, **Quando** o usuário corrigir seu conteúdo,
   **Então** o destaque de erro desse campo deve ser removido imediatamente.

---

### User Story 4 - Cancelar sem salvar (Priority: P2)

O usuário abre o modal, começa a preencher e decide não prosseguir. Ao fechar o modal (botão Cancelar
ou clique fora), nenhum dado é registrado e o estado da tela subjacente não é alterado.

**Why this priority**: Comportamento de saída segura; secundário porque não muda dados, mas necessário
para a experiência completa.

**Independent Test**: Abrir o modal, preencher parcialmente e fechar; verificar que a listagem não
mudou e que o saldo permanece inalterado.

**Acceptance Scenarios**:

1. **Dado** que o modal está aberto com campos parcialmente preenchidos, **Quando** o usuário tocar em
   "Cancelar", **Então** o modal deve fechar sem registrar nada.
2. **Dado** que o modal está aberto, **Quando** o usuário tocar fora da área do modal,
   **Então** o modal deve fechar sem registrar nada.

---

### Edge Cases

- O que acontece se o usuário não tiver nenhum cartão cadastrado e selecionar "Cartão" como forma de
  pagamento? O sistema deve informar que não há cartões cadastrados e sugerir criar um.
- O que acontece se o saldo da conta família já estiver zerado? O gasto com dinheiro deve ser permitido
  (saldo pode ser negativo) ou bloqueado? Assumido: permitido, pois saldo negativo pode ser intencional.
- O que acontece se a data informada for futura? O gasto deve ser registrado normalmente com a data
  escolhida.
- O que acontece se dois usuários da mesma conta família registrarem gastos no mesmo cartão ao mesmo
  tempo? Deve ser tratado via transação atômica no banco, garantindo que o limite nunca seja
  ultrapassado.
- O que acontece se a conexão cair após o servidor processar mas antes do cliente receber a resposta?
  O gasto já foi registrado; o usuário pode tentar novamente — o sistema deve ser idempotente ou
  orientar o usuário a verificar a listagem antes de resubmeter.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir um modal de criação de gasto acessível a partir da tela de despesas.
- **FR-002**: O modal DEVE conter os campos: nome, valor, forma de pagamento (Dinheiro / Cartão) e data.
- **FR-003**: O campo data DEVE ser pré-preenchido com a data de hoje ao abrir o modal.
- **FR-004**: O sistema DEVE rejeitar o nome com menos de 3 caracteres e indicar o erro ao usuário.
- **FR-005**: O sistema DEVE rejeitar valor zero ou negativo e indicar o erro ao usuário.
- **FR-006**: Quando a forma de pagamento for "Cartão", o sistema DEVE exibir a lista de cartões
  cadastrados na conta família para que o usuário selecione um.
- **FR-007**: O sistema DEVE verificar se o valor do gasto é menor ou igual ao limite disponível do
  cartão selecionado antes de confirmar o registro.
- **FR-008**: O sistema DEVE impedir o registro quando o valor exceder o limite disponível do cartão,
  informando o limite atual ao usuário.
- **FR-009**: Ao confirmar um gasto com "Dinheiro", o sistema DEVE reduzir o saldo disponível da conta
  família pelo valor exato informado.
- **FR-010**: Ao confirmar um gasto com "Cartão", o sistema DEVE reduzir o saldo disponível da conta
  família e incrementar o limite utilizado do cartão selecionado, ambos pelo valor exato informado.
- **FR-011**: A redução de saldo da família e a atualização do limite do cartão DEVEM ocorrer de forma
  atômica: ou ambas acontecem, ou nenhuma.
- **FR-012**: A verificação de limite do cartão e a atualização do limite utilizado DEVEM usar bloqueio
  pessimista na linha do cartão (SELECT … FOR UPDATE) para garantir integridade sob concorrência.
- **FR-013**: Após registro bem-sucedido, o modal DEVE ser fechado e uma notificação de sucesso DEVE
  ser exibida.
- **FR-014**: Após registro bem-sucedido, a listagem de gastos DEVE ser atualizada sem recarregar a
  página.
- **FR-015**: O `usuarioId` e o `contaFamiliaId` DEVEM ser obtidos exclusivamente da sessão autenticada
  no servidor — nunca recebidos como entrada do cliente.
- **FR-016**: O modal DEVE ser fechável pelo botão "Cancelar" ou clique fora, sem registrar nada.

### Key Entities *(include if feature involves data)*

- **Gasto**: representa um gasto pontual registrado por um membro da conta família. Atributos
  relevantes: nome (texto, ≥ 3 chars), valor (decimal positivo), forma de pagamento
  (Dinheiro | Cartão), data do gasto, referência ao cartão (quando aplicável), referência à conta
  família e ao usuário que registrou.
- **Conta Família**: agrega os membros e o saldo financeiro disponível. Um gasto reduz esse saldo.
- **Cartão de Crédito**: pertence à conta família, possui limite total e limite utilizado. Um gasto
  via cartão incrementa o limite utilizado; a operação deve ser atômica com a redução do saldo da
  família.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuário consegue registrar um gasto completo (nome, valor, forma de pagamento, data)
  em menos de 30 segundos a partir do momento em que abre o modal.
- **SC-002**: 100% dos gastos confirmados refletem exatamente o valor informado no saldo da conta
  família — sem arredondamentos ou perdas de precisão.
- **SC-003**: O limite de nenhum cartão é ultrapassado em nenhum cenário de concorrência; a taxa de
  violação de limite deve ser 0%.
- **SC-004**: Erros de validação (nome curto, valor inválido, limite excedido) são comunicados ao
  usuário antes de qualquer tentativa de persistência — nenhum dado corrompido chega ao banco.
- **SC-005**: A listagem de gastos reflete o novo registro imediatamente após o fechamento do modal,
  sem ação adicional do usuário.
- **SC-006**: Ao tentar registrar dois gastos simultâneos que individualmente caberiam no limite mas
  juntos ultrapassariam, apenas o primeiro a ser processado é aceito; o segundo recebe erro de limite
  excedido.

## Assumptions

- O usuário já está autenticado e pertence a uma conta família ativa; o fluxo de autenticação está
  fora do escopo desta feature.
- Saldo da conta família pode ficar negativo quando o pagamento é em dinheiro — não há bloqueio por
  saldo insuficiente para essa forma de pagamento.
- Gastos com data futura são válidos e devem ser registrados normalmente.
- A lista de cartões apresentada no modal inclui apenas os cartões ativos da conta família do usuário
  autenticado.
- O modal é acionado a partir da tela de despesas já existente; a navegação para abrir o modal está
  fora do escopo desta spec (assumido como botão "+" já disponível na tela).
- Valores monetários são armazenados e operados como Decimal — aritmética de ponto flutuante não é
  utilizada.
- A concorrência a ser tratada é entre membros da mesma conta família (múltiplos usuários acessando
  ao mesmo tempo), não entre contas família diferentes.
