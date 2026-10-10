# Feature Specification: Cadastro de cartões de crédito

**Feature Branch**: `004-cadastro-cartoes-credito`

**Created**: 2026-10-10

**Status**: Draft

**Input**: User description: "Implementar o cadastro de cartões de crédito no Financy — modelagem e
migration, listagem, cadastro, edição e exclusão de cartões compartilhados pela conta família, acessados
pela opção 'Cartões' do menu lateral 'Mais opções'. Campos: nome, instituição financeira, limite total,
dia de fechamento e dia de vencimento. Interface mobile first baseada na referência
`reference/create_card_example.jpg`. Nenhum dado sensível de pagamento é solicitado ou armazenado."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar um cartão de crédito (Priority: P1)

O usuário abre o menu lateral "Mais opções", toca em "Cartões" e chega à tela de cartões da sua conta
família. Ao tocar em "Novo cartão", abre-se a tela de cadastro: no topo, uma pré-visualização do cartão
(no estilo da referência visual) que se atualiza conforme o preenchimento; abaixo, os campos nome do
cartão, instituição financeira, limite total, dia de fechamento e dia de vencimento; no rodapé, o botão de
salvar. Ao salvar com dados válidos, o cartão é registrado na conta família do usuário, uma confirmação é
exibida e o usuário volta para a listagem, onde o novo cartão já aparece.

**Why this priority**: Sem o cadastro não há cartões para listar, editar ou excluir; é o núcleo da
funcionalidade.

**Independent Test**: Abrir "Mais opções" → "Cartões" → "Novo cartão", preencher todos os campos com
valores válidos, salvar e verificar que a confirmação aparece e o cartão consta na listagem.

**Acceptance Scenarios**:

1. **Dado** que o usuário está autenticado, **Quando** tocar em "Cartões" no menu "Mais opções",
   **Então** deve ser levado para a tela de cartões da sua conta família.
2. **Dado** que a tela de cadastro está aberta, **Quando** for exibida, **Então** deve mostrar a
   pré-visualização do cartão, os campos nome, instituição financeira, limite total, dia de fechamento e
   dia de vencimento, e o botão de salvar — sem nenhum campo para número do cartão, CVV, validade ou
   senha.
3. **Dado** que todos os campos estão preenchidos com valores válidos, **Quando** o usuário salvar,
   **Então** o cartão deve ser registrado na conta família do usuário logado, uma confirmação deve ser
   exibida e a listagem deve mostrar o novo cartão sem recarregar a página.
4. **Dado** que o envio está em andamento, **Quando** o usuário tocar novamente em salvar, **Então**
   nenhum cadastro duplicado deve ser criado e o botão deve indicar o carregamento.

---

### User Story 2 - Ser orientado quando há erro no preenchimento (Priority: P1)

O usuário tenta salvar com algum campo vazio ou inválido. O cartão não é registrado, uma mensagem
compreensível explica o problema, o campo com erro é destacado e recebe o foco, e os dados já
preenchidos são mantidos.

**Why this priority**: Faz parte do fluxo mínimo de cadastro; sem esse retorno o usuário não consegue
concluir a operação quando erra.

**Independent Test**: Tentar salvar com nome vazio, instituição vazia, limite zero ou negativo, dia 0 e
dia 32, e verificar para cada caso a mensagem, o destaque do campo e a preservação dos demais dados.

**Acceptance Scenarios**:

1. **Dado** que o nome ou a instituição financeira está vazio (ou só com espaços), **Quando** o usuário
   salvar, **Então** o cadastro não deve ocorrer e o campo deve ser apontado como obrigatório.
2. **Dado** que o limite total está vazio, é zero, negativo ou não numérico, **Quando** o usuário
   salvar, **Então** o cadastro não deve ocorrer e o campo deve informar que o limite deve ser maior que
   zero.
3. **Dado** que o dia de fechamento ou de vencimento está vazio, não é inteiro ou está fora de 1 a 31,
   **Quando** o usuário salvar, **Então** o cadastro não deve ocorrer e o campo deve informar o intervalo
   permitido.
4. **Dado** que o servidor rejeitou o envio (validação, conflito ou falha inesperada), **Quando** o erro
   for exibido, **Então** todos os valores digitados devem permanecer no formulário.
5. **Dado** que já existe um cartão com o mesmo nome na conta família (ignorando maiúsculas/minúsculas e
   espaços nas extremidades), **Quando** o usuário salvar, **Então** o cadastro não deve ocorrer e o campo
   nome deve informar a duplicidade.

---

### User Story 3 - Consultar os cartões da família (Priority: P1)

O usuário abre a tela de cartões e vê todos os cartões da sua conta família, cada um com nome,
instituição financeira, limite usado e limite total, além das ações de editar e excluir. Quando ainda não
há cartões, a tela mostra um estado vazio com uma chamada para cadastrar o primeiro.

**Why this priority**: É o ponto de entrada da funcionalidade e o lugar onde o resultado do cadastro, da
edição e da exclusão é verificado.

**Independent Test**: Com uma conta família sem cartões, abrir a tela e ver o estado vazio; cadastrar dois
cartões e ver ambos listados com os quatro dados e as duas ações.

**Acceptance Scenarios**:

1. **Dado** que a conta família possui cartões, **Quando** o usuário abrir a tela de cartões, **Então**
   cada cartão deve exibir nome, instituição financeira, limite usado (R$ 0,00 nesta entrega), limite
   total, a ação editar e — para administradores — a ação excluir.
2. **Dado** que a conta família não possui cartões, **Quando** o usuário abrir a tela, **Então** deve ver
   um estado vazio com uma chamada para cadastrar o primeiro cartão.
3. **Dado** que outra conta família possui cartões, **Quando** o usuário abrir a tela, **Então** nenhum
   desses cartões deve aparecer.
4. **Dado** que a listagem está sendo carregada ou falhou, **Quando** a tela for exibida, **Então** deve
   mostrar respectivamente um estado de carregamento ou uma mensagem de erro.

---

### User Story 4 - Editar um cartão (Priority: P2)

O usuário toca em "Editar" em um cartão da listagem, vê o formulário preenchido com os dados atuais,
altera o que precisa e salva. As mesmas validações do cadastro se aplicam; ao concluir, a confirmação é
exibida e a listagem mostra os novos dados.

**Why this priority**: Corrige erros de digitação e acompanha mudanças reais (ex.: aumento de limite),
mas o valor principal já existe sem ela.

**Independent Test**: Editar o limite e o dia de vencimento de um cartão existente e verificar a
listagem atualizada.

**Acceptance Scenarios**:

1. **Dado** um cartão existente, **Quando** o usuário tocar em "Editar", **Então** o formulário deve
   abrir com os valores atuais do cartão.
2. **Dado** alterações válidas, **Quando** o usuário salvar, **Então** o cartão deve ser atualizado, a
   confirmação exibida e a listagem refletir as mudanças.
3. **Dado** alterações inválidas, **Quando** o usuário salvar, **Então** as mesmas regras de erro do
   cadastro devem ser aplicadas e nada deve ser alterado.
4. **Dado** que o cartão foi excluído ou pertence a outra família, **Quando** o usuário tentar abri-lo ou
   salvá-lo, **Então** o sistema deve informar que o cartão não foi encontrado e não alterar nenhum dado.

---

### User Story 5 - Excluir um cartão (Priority: P2)

O administrador toca em "Excluir" em um cartão, confirma a ação em um diálogo e o cartão deixa de aparecer na
listagem, com uma mensagem informando o resultado. Cancelar o diálogo não altera nada.

**Why this priority**: Mantém a lista organizada quando um cartão deixa de ser usado; menos frequente
que cadastro e edição.

**Independent Test**: Excluir um cartão, cancelando uma vez e confirmando em seguida, e verificar que só
após a confirmação o cartão some da listagem e que nenhuma despesa ou pagamento foi alterado.

**Acceptance Scenarios**:

1. **Dado** um cartão na listagem, **Quando** o usuário tocar em "Excluir", **Então** deve ser pedida
   uma confirmação explícita antes de qualquer alteração.
2. **Dado** o diálogo de confirmação aberto, **Quando** o usuário cancelar, **Então** o cartão deve
   permanecer inalterado.
3. **Dado** o diálogo de confirmação aberto, **Quando** o usuário confirmar, **Então** o cartão deve
   deixar de aparecer na listagem e uma mensagem de sucesso deve ser exibida.
4. **Dado** que o cartão possui vínculos com registros financeiros que dependem dele, **Quando** o
   usuário tentar excluí-lo, **Então** a exclusão deve ser impedida e o motivo informado.
5. **Dado** que o usuário não é administrador, **Quando** visualizar a listagem ou tentar excluir um
   cartão por requisição direta, **Então** a ação não deve ser oferecida e o servidor deve rejeitá-la
   informando permissão insuficiente.
6. **Dado** qualquer exclusão de cartão, **Quando** ela for concluída, **Então** nenhuma despesa,
   pagamento ou tag deve ser excluído ou alterado.

---

### Edge Cases

- Usuário sem conta família associada: as telas de cartões não exibem dados de nenhuma família e
  informam o problema, como já ocorre nas telas de despesas.
- Requisição forjada com identificador de cartão de outra família: tratada como cartão inexistente, sem
  revelar sua existência.
- Requisição que inclui um identificador de conta família: o valor é ignorado; a família vem sempre da
  sessão.
- Dias 29, 30 e 31: aceitos; o cadastro apenas registra o dia informado (o ajuste para meses mais curtos
  pertence ao futuro cálculo de faturas, fora de escopo).
- Dia de fechamento igual ao de vencimento: aceito.
- Limite com mais de duas casas decimais ou acima do máximo suportado: rejeitado com mensagem clara.
- Nome ou instituição com espaços nas extremidades: espaços removidos antes de validar e salvar.
- Dois membros editando o mesmo cartão ao mesmo tempo: prevalece a última gravação.
- Cartão excluído por outro membro enquanto o usuário o edita ou exclui: informado como não encontrado.
- Perda de conexão durante o envio: mensagem de erro, dados mantidos e botão liberado para nova
  tentativa.
- Exclusão de uma conta família que possui cartões: bloqueada, sem apagar cartões em cascata.

## Requirements *(mandatory)*

### Functional Requirements

**Navegação e telas**

- **FR-001**: A opção "Cartões" do menu lateral "Mais opções" MUST levar à tela de listagem de cartões.
- **FR-002**: A tela de listagem MUST oferecer uma ação para cadastrar um novo cartão, que leva à tela
  de cadastro.
- **FR-003**: A tela de cadastro e a de edição MUST seguir a referência visual
  `reference/create_card_example.jpg` (cabeçalho com voltar e título, pré-visualização do cartão no
  topo, campos arredondados com rótulos visíveis e botão principal fixo no rodapé), substituindo os
  dados sensíveis da referência (número, validade, CVV, titular) por nome, instituição, limite e dias de
  fechamento/vencimento.
- **FR-004**: A pré-visualização MUST refletir em tempo real os valores digitados, com textos padrão
  enquanto os campos estão vazios.
- **FR-005**: Cancelar ou voltar a partir do cadastro ou edição MUST retornar à listagem sem salvar.

**Dados e validação**

- **FR-006**: O sistema MUST coletar nome do cartão, instituição financeira, limite total, dia de
  fechamento e dia de vencimento — todos obrigatórios.
- **FR-007**: Nome e instituição MUST ser texto não vazio após remover espaços das extremidades, com até
  60 caracteres cada.
- **FR-008**: O limite total MUST ser um valor monetário maior que zero, com no máximo duas casas
  decimais e dentro do máximo suportado para valores monetários do sistema.
- **FR-009**: Os dias de fechamento e vencimento MUST ser números inteiros entre 1 e 31.
- **FR-010**: O nome do cartão MUST ser único dentro da conta família, sem diferenciar maiúsculas e
  minúsculas e ignorando espaços nas extremidades.
- **FR-011**: As validações MUST ocorrer no cliente, antes do envio, e novamente no servidor, antes de
  qualquer gravação, com as mesmas regras e mensagens.
- **FR-012**: O sistema MUST NOT solicitar, aceitar ou armazenar número do cartão (total ou parcial),
  CVV, validade, nome do titular impresso, senha ou qualquer credencial bancária; campos desconhecidos
  enviados ao servidor MUST ser descartados.
- **FR-013**: Erros MUST ser apresentados em linguagem compreensível, destacando o campo afetado e
  movendo o foco para o primeiro campo com erro, sem apagar os valores já preenchidos.

**Listagem**

- **FR-014**: A listagem MUST exibir apenas os cartões da conta família do usuário logado, cada um com
  nome, instituição financeira, limite usado, limite total, a ação editar e, para administradores, a
  ação excluir.
- **FR-015**: O limite usado MUST ser exibido como R$ 0,00 em todos os cartões nesta entrega, já que
  compras no cartão e cálculo de limite estão fora de escopo; o valor não é informado pelo usuário nem
  armazenado, e passará a ser calculado quando houver vínculo com compras.
- **FR-016**: A listagem MUST ser ordenada por nome do cartão, em ordem alfabética.
- **FR-017**: Sem cartões cadastrados, a tela MUST exibir um estado vazio com chamada para cadastrar o
  primeiro cartão.
- **FR-018**: Valores monetários MUST ser exibidos no formato de moeda brasileira (R$).

**Edição e exclusão**

- **FR-019**: A edição MUST carregar os valores atuais do cartão e aplicar as mesmas regras do cadastro.
- **FR-020**: A exclusão MUST exigir confirmação explícita em diálogo; nada é alterado até a
  confirmação.
- **FR-021**: A exclusão MUST ser impedida, com o motivo informado, quando houver registros financeiros
  que dependam do cartão. Nesta entrega não existem tais vínculos.
- **FR-022**: A exclusão de um cartão MUST NOT excluir ou alterar despesas, pagamentos ou tags.
- **FR-023**: Apenas administradores MUST poder excluir cartões, como nas despesas; para os demais
  membros a ação de excluir não é oferecida e qualquer tentativa direta é rejeitada no servidor com
  mensagem de permissão insuficiente.

**Escopo familiar, autorização e consistência**

- **FR-024**: Todo cartão MUST pertencer a exatamente uma conta família, definida no servidor a partir
  da sessão do usuário logado; o cliente nunca informa a conta família.
- **FR-025**: Toda consulta e alteração MUST ser autorizada no servidor, verificando que o usuário está
  autenticado e é membro da conta família dona do cartão.
- **FR-026**: Operações sobre cartões inexistentes ou de outra família MUST ser rejeitadas com a mesma
  resposta de "cartão não encontrado".
- **FR-027**: A exclusão de uma conta família MUST NOT apagar cartões em cascata; ela deve ser bloqueada
  enquanto houver cartões vinculados.
- **FR-028**: Cadastro, edição e exclusão MUST ser atômicos: ou a operação é concluída por inteiro ou
  nenhum dado é alterado.
- **FR-029**: Os cartões MUST registrar data de criação e de última atualização.
- **FR-030**: A introdução de cartões MUST preservar todos os dados existentes e não alterar entidades
  não relacionadas.

**Estados de interface e experiência**

- **FR-031**: As telas MUST apresentar estados de carregamento, sucesso, erro e lista vazia.
- **FR-032**: Os botões de envio MUST ficar indisponíveis e indicar carregamento enquanto a operação
  estiver em andamento, impedindo envios duplicados.
- **FR-033**: O layout MUST ser mobile first, com áreas de toque de pelo menos 44×44 px, teclado numérico
  nos campos de valor e dias, e adaptar-se a telas maiores sem rolagem horizontal.
- **FR-034**: As telas MUST ser acessíveis: rótulos visíveis, mensagens de erro associadas aos campos,
  diálogo de confirmação com foco gerenciado e navegação completa por teclado.

**Qualidade**

- **FR-035**: As regras de validação e os fluxos de cadastro, listagem, edição, exclusão e isolamento
  entre famílias MUST possuir testes automatizados.

### Key Entities *(include if feature involves data)*

- **Cartão de crédito**: cartão compartilhado por uma conta família. Atributos: identificador, nome,
  nome normalizado (para unicidade), instituição financeira, limite total (valor monetário exato),
  dia de fechamento, dia de vencimento, data de criação e data de atualização. Pertence obrigatoriamente
  a uma conta família; não guarda nenhum dado sensível de pagamento.
- **Conta família** (existente): agrupa membros e registros financeiros compartilhados; passa a possuir
  cartões. Não pode ser excluída enquanto houver cartões vinculados.
- **Membro da conta família** (existente): define quem pode acessar os cartões da família.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuário cadastra um cartão, a partir da tela inicial, em menos de 1 minuto em um
  celular.
- **SC-002**: 100% das tentativas com nome ou instituição vazios, limite menor ou igual a zero ou dias
  fora de 1 a 31 são rejeitadas, tanto pelo formulário quanto por envio direto ao servidor.
- **SC-003**: 0 exclusões são realizadas por membros que não são administradores, e 0 cartões de outra família são exibidos, editados ou excluídos em testes com requisições
  forjadas.
- **SC-004**: Após salvar, editar ou excluir, a listagem reflete a mudança em até 2 segundos, sem recarga
  manual.
- **SC-005**: Toques repetidos no botão de salvar durante o envio resultam em exatamente um cartão
  criado.
- **SC-006**: As telas de cartões funcionam sem rolagem horizontal entre 320 px e 1440 px de largura.
- **SC-007**: Nenhum campo ou registro armazenado contém número de cartão, CVV, validade ou credenciais.
- **SC-008**: Excluir cartões não altera nenhuma despesa, pagamento ou tag existente, e a introdução da
  funcionalidade não altera nenhum dado pré-existente.

## Assumptions

- A conta família ativa é a do usuário logado, obtida da sessão pelo mesmo mecanismo usado nas
  despesas; não há seletor de família nesta entrega.
- Qualquer membro da conta família pode cadastrar e editar cartões (como nas despesas); somente
  administradores excluem (FR-023).
- O nome do cartão é único por família, como despesas e tags, para evitar ambiguidade na listagem.
- Como não há vínculos de cartões com outros registros nesta entrega, a exclusão é física; a regra de
  bloqueio (FR-021) passa a valer quando um vínculo for implementado.
- Nome e instituição são texto livre com até 60 caracteres; não há catálogo de bancos.
- Cadastro e edição usam telas próprias (não modais), seguindo o padrão da tela de nova despesa.
- Confirmações e erros usam as notificações já adotadas no projeto.
- O projeto ainda não possui ferramenta de testes definida (decisão pendente no README); a escolha será
  feita no planejamento.
- Itens listados como fora de escopo pelo usuário (Open Finance, faturas, compras no cartão, cálculo de
  limite disponível, parcelamento, juros, cartões adicionais, compartilhamento entre famílias,
  notificações e relatórios) não fazem parte desta entrega.
