# Feature Specification: Tela de nova despesa

**Feature Branch**: `003-tela-nova-despesa`

**Created**: 2026-10-01

**Status**: Draft

**Input**: User description: "Implementar criação da tela de adicionar despesas — nova tela de cadastro com
título, descrição da tela, formulário (nome, descrição, vencimento, recorrência, valor), informativo de
campos obrigatórios e botões de salvar e cancelar. Nome, vencimento e valor são obrigatórios; a conta
família vem do usuário logado; o nome normalizado é verificado no banco antes de inserir; cancelar e
salvar com sucesso voltam para a última tela acessada; erros exibem toast e destacam o campo com borda
vermelha e foco automático."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar uma nova despesa (Priority: P1)

O usuário abre o menu de criação do navbar inferior, escolhe "Nova despesa" e é levado a uma tela de
cadastro. A tela mostra um título, uma breve descrição do que ela faz, o formulário com os campos nome,
descrição, vencimento, valor e a opção "Despesa recorrente", além de um aviso indicando quais campos são
obrigatórios. Ao preencher os dados e tocar em "Salvar", a despesa é registrada na conta família do
usuário, uma mensagem de sucesso é exibida e ele volta para a tela em que estava antes.

**Why this priority**: É o objetivo da funcionalidade. Hoje a operação de criar despesa existe apenas no
servidor e não há forma de o usuário cadastrar despesas pela interface.

**Independent Test**: A partir da tela de despesas, abrir o menu de criação, tocar em "Nova despesa",
preencher os campos obrigatórios, salvar e verificar que a nova despesa aparece na listagem do mês do
vencimento.

**Acceptance Scenarios**:

1. **Dado** que o usuário está autenticado, **Quando** tocar em "Nova despesa" no menu de criação do
   navbar, **Então** deve ser levado para a tela de nova despesa.
2. **Dado** que a tela de nova despesa está aberta, **Quando** for exibida, **Então** deve mostrar
   título, descrição da tela, os campos nome, descrição, vencimento, valor e a opção de recorrência, o
   aviso de campos obrigatórios e os botões "Salvar" e "Cancelar".
3. **Dado** que os campos obrigatórios estão preenchidos com valores válidos, **Quando** o usuário tocar
   em "Salvar", **Então** a despesa deve ser registrada na conta família do usuário, uma mensagem de
   sucesso deve ser exibida e o usuário deve voltar para a tela anterior.
4. **Dado** que o usuário marcou "Despesa recorrente", **Quando** salvar, **Então** a despesa deve ser
   registrada como recorrente e passar a aparecer em todos os meses a partir do vencimento.
5. **Dado** que a despesa foi salva e o usuário voltou para a tela de despesas, **Quando** a listagem
   for exibida, **Então** a nova despesa deve aparecer sem que ele precise recarregar a página.

---

### User Story 2 - Ser orientado quando há erro no preenchimento (Priority: P1)

O usuário tenta salvar com algum campo obrigatório vazio, com um valor inválido ou com um nome que já
existe na conta família. O sistema não registra a despesa, exibe uma notificação de erro explicando o
problema, destaca com borda vermelha o campo que precisa de correção e posiciona o cursor nele para que
o usuário corrija imediatamente.

**Why this priority**: Sem esse retorno o usuário não consegue concluir o cadastro quando erra; faz parte
do fluxo mínimo de criação.

**Independent Test**: Tentar salvar com o nome vazio, depois com valor zero, depois com um nome já
cadastrado (variando maiúsculas/minúsculas) e verificar em cada caso a notificação, o destaque e o foco
no campo correto, sem que nada seja registrado.

**Acceptance Scenarios**:

1. **Dado** que o nome está vazio, **Quando** o usuário tocar em "Salvar", **Então** deve ser exibida
   uma notificação de erro, o campo nome deve ficar com borda vermelha e receber o foco, e nada deve ser
   registrado.
2. **Dado** que mais de um campo obrigatório está vazio, **Quando** o usuário tocar em "Salvar",
   **Então** todos os campos com problema devem ficar com borda vermelha e o foco deve ir para o
   primeiro deles na ordem do formulário.
3. **Dado** que o valor informado é zero, negativo ou não é um número válido, **Quando** o usuário
   tocar em "Salvar", **Então** deve ser exibida uma notificação de erro e o campo valor deve ficar
   destacado e receber o foco.
4. **Dado** que já existe na conta família uma despesa ativa com o mesmo nome, ignorando diferenças de
   maiúsculas/minúsculas e espaços nas pontas, **Quando** o usuário tocar em "Salvar", **Então** deve
   ser exibida a notificação "Já existe uma despesa com este nome.", o campo nome deve ficar destacado e
   receber o foco, e nada deve ser registrado.
5. **Dado** que um campo está destacado como inválido, **Quando** o usuário corrigir o conteúdo desse
   campo, **Então** o destaque de erro desse campo deve ser removido.
6. **Dado** que o usuário preencheu o formulário e ocorreu um erro, **Quando** a notificação for
   exibida, **Então** os valores já digitados devem ser mantidos no formulário.

---

### User Story 3 - Cancelar o cadastro (Priority: P2)

O usuário desiste do cadastro e toca em "Cancelar". Ele volta para a tela em que estava antes de abrir a
tela de nova despesa, sem que nada seja registrado.

**Why this priority**: É critério de aceite e evita que o usuário fique preso na tela, mas o valor
principal está no cadastro em si.

**Independent Test**: Abrir a tela de nova despesa a partir do Início e a partir de Despesas, tocar em
"Cancelar" em cada caso e verificar que volta para a tela de origem sem registrar nada.

**Acceptance Scenarios**:

1. **Dado** que o usuário abriu a tela de nova despesa a partir de outra tela do aplicativo, **Quando**
   tocar em "Cancelar", **Então** deve voltar para essa tela e nenhuma despesa deve ser registrada.
2. **Dado** que o usuário acessou a tela de nova despesa diretamente pelo endereço, sem tela anterior no
   aplicativo, **Quando** tocar em "Cancelar" ou salvar com sucesso, **Então** deve ser levado para a
   tela de despesas.

---

### Edge Cases

- Nome com espaços no início ou no fim: os espaços são descartados antes de salvar e na verificação de
  nome repetido.
- Nome de uma despesa que foi excluída: pode ser reutilizado, pois despesas excluídas não bloqueiam
  nomes.
- Nome com mais de 80 caracteres ou descrição com mais de 500: o formulário não deve permitir digitar
  além do limite e o servidor rejeita caso receba.
- Valor com vírgula ou ponto como separador decimal (ex.: "120,50" ou "120.50"): ambos aceitos; mais de
  duas casas decimais é rejeitado.
- Dois toques seguidos em "Salvar": apenas uma despesa deve ser registrada; o botão fica desabilitado e
  indica processamento enquanto o envio está em andamento.
- Dois membros da mesma família salvando o mesmo nome ao mesmo tempo: apenas um cadastro é aceito; o
  outro recebe a notificação de nome repetido.
- Sessão expirada ao salvar: o usuário recebe a notificação padronizada de sessão inválida e é tratado
  pelo fluxo de autenticação existente.
- Usuário sem conta família associada: o cadastro é recusado com a mensagem padronizada já existente.
- Falha inesperada ao salvar: notificação de erro padronizada, valores do formulário mantidos e o
  usuário pode tentar de novo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE disponibilizar uma tela de nova despesa acessível pela opção "Nova despesa"
  do menu de criação do navbar inferior.
- **FR-002**: A tela DEVE exibir um título, uma descrição curta do propósito da tela, o formulário, um
  aviso de campos obrigatórios e os botões "Salvar" e "Cancelar".
- **FR-003**: O formulário DEVE conter os campos nome, descrição, vencimento, valor e uma caixa de
  seleção "Despesa recorrente", desmarcada por padrão.
- **FR-004**: Nome, vencimento e valor DEVEM ser obrigatórios e identificados visualmente como tal (ex.:
  asterisco no rótulo), em consonância com o aviso de campos obrigatórios.
- **FR-005**: O sistema DEVE validar os dados tanto na tela, antes do envio, quanto no servidor, com as
  mesmas regras do cadastro de despesas existente: nome de 1 a 80 caracteres, descrição opcional de até
  500 caracteres, vencimento em data válida e valor maior que zero com até duas casas decimais.
- **FR-006**: A conta família e o autor da despesa DEVEM ser determinados no servidor a partir do
  usuário logado; a tela NÃO DEVE enviar essas informações.
- **FR-007**: Antes de registrar, o sistema DEVE verificar se já existe despesa ativa na mesma conta
  família com o mesmo nome normalizado (sem espaços nas pontas e sem diferença entre maiúsculas e
  minúsculas) e, se existir, recusar o cadastro com a mensagem "Já existe uma despesa com este nome.".
- **FR-008**: A data de lançamento da despesa DEVE ser preenchida automaticamente com a data atual
  (fuso de São Paulo), sem campo na tela.
- **FR-009**: Em caso de erro de validação ou de nome repetido, o sistema DEVE exibir uma notificação de
  erro (toast), destacar com borda vermelha cada campo com problema, exibir a mensagem do erro junto ao
  campo e mover o foco para o primeiro campo inválido na ordem do formulário.
- **FR-010**: Os campos destacados DEVEM ser anunciados como inválidos por leitores de tela, com a
  mensagem de erro associada ao campo.
- **FR-011**: Ao salvar com sucesso, o sistema DEVE exibir uma notificação de sucesso e retornar o
  usuário à tela anterior, com a listagem de despesas já refletindo o novo registro, exceto quando a
  opção "Continuar adicionando despesas" estiver marcada.
- **FR-011a**: Ao final da tela DEVE existir a opção "Continuar adicionando despesas" (desmarcada por
  padrão). Quando marcada, um cadastro bem-sucedido mantém o usuário na tela, limpa todos os campos e
  move o foco para o nome; a opção permanece marcada. Em caso de erro, os campos preenchidos são mantidos.
- **FR-012**: O botão "Cancelar" DEVE retornar o usuário à tela anterior sem registrar nada.
- **FR-013**: Quando não houver tela anterior dentro do aplicativo, cancelar e salvar com sucesso DEVEM
  levar o usuário à tela de despesas.
- **FR-014**: Enquanto o envio estiver em andamento, o botão "Salvar" DEVE ficar desabilitado e indicar
  processamento, impedindo cadastros duplicados por toques repetidos.
- **FR-015**: Em caso de erro, os valores já digitados DEVEM ser preservados no formulário.
- **FR-016**: A tela DEVE ser acessível apenas a usuários autenticados e seguir a abordagem mobile-first,
  com rótulos visíveis em todos os campos, foco visível e navegação completa por teclado.
- **FR-017**: O navbar inferior DEVE permanecer visível na tela de nova despesa, seguindo o layout das
  demais telas autenticadas.

### Key Entities

- **Despesa**: compromisso financeiro da conta família. Nesta tela são informados nome, descrição,
  vencimento, valor e se é recorrente; a conta família, o autor e a data de lançamento são definidos
  pelo sistema. Tags não são informadas nesta tela.
- **Conta família**: agrupamento ao qual o usuário logado pertence e ao qual a nova despesa é vinculada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário consegue cadastrar uma despesa, a partir de qualquer tela autenticada, em menos
  de 1 minuto.
- **SC-002**: 100% das tentativas de salvar com campo obrigatório vazio, valor inválido ou nome repetido
  são recusadas, com notificação de erro e foco no campo a corrigir.
- **SC-003**: Em 100% dos cadastros bem-sucedidos (sem "Continuar adicionando despesas") e cancelamentos, o usuário volta para a tela de origem
  (ou para a tela de despesas, quando não houver origem).
- **SC-004**: Nenhuma despesa duplicada é criada por toques repetidos em "Salvar".
- **SC-005**: A despesa criada aparece na listagem de despesas imediatamente ao retornar, sem recarregar a
  página.
- **SC-006**: Todo o fluxo (preencher, salvar, corrigir erros e cancelar) pode ser realizado apenas com
  teclado e com leitor de tela.

## Assumptions

- A operação de criar despesa no servidor, com validação, verificação de nome repetido e vínculo com a
  conta família, já existe (feature 002) e será reutilizada; esta feature entrega a tela e a integração.
- O ponto de entrada é a opção "Nova despesa" já existente no menu de criação do navbar inferior. Não
  será adicionado outro botão de criação na tela de despesas.
- Tags e data de lançamento ficam fora do formulário: tags podem ser tratadas na futura tela de edição e
  o lançamento assume a data de hoje.
- "Tela anterior" é a última tela do aplicativo visitada antes de abrir o cadastro (histórico de
  navegação). Acesso direto pelo endereço cai na tela de despesas.
- O vencimento não tem valor padrão nem restrição de passado/futuro: datas passadas são aceitas, pois a
  despesa pode ter vencido antes de ser registrada.
- As notificações usam o componente de toast e as mensagens padronizadas já existentes no aplicativo.
- Fora de escopo: edição, exclusão, marcação de pagamento pela interface, gestão de tags e outras opções
  do menu de criação (nova entrada, novo gasto, novo desejo).
