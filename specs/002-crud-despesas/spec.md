# Feature Specification: CRUD de Despesas

**Feature Branch**: `002-crud-despesas`

**Created**: 2026-09-30

**Status**: Draft

**Input**: User description: "Implementar crud de despesas — entidades de despesa com opção de recorrência, regras de status e pagamento validadas no servidor, tela de listagem com busca, filtros, separação visual por status, loading skeleton, tratamento de erros padronizado e mensagens em toast. Modal de adicionar despesa e rotinas de interação (adicionar, editar, excluir, alterar status) pela interface ficam fora de escopo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualizar as despesas do mês por situação (Priority: P1)

O usuário toca no segundo ícone do navbar inferior (Despesas) e vê a lista das despesas do mês de
referência atual, ordenadas pelo vencimento mais próximo. As despesas aparecem separadas de forma
simples em grupos por situação — vencidas, abertas (incluindo as com vencimento próximo) e pagas.
Despesas pagas aparecem com opacidade reduzida; despesas vencidas têm suas informações destacadas
em vermelho. Enquanto os dados são carregados, a tela exibe um esqueleto de carregamento no formato
da lista.

**Why this priority**: É o valor central da funcionalidade: saber o que precisa ser pago e o que
já foi pago. Sem a listagem, nenhuma outra história é observável pela interface.

**Independent Test**: Com despesas cadastradas diretamente na base (pagas, abertas, próximas do
vencimento e vencidas), acessar a tela pelo ícone de Despesas e verificar agrupamento, ordenação,
estilos por situação e o esqueleto de carregamento.

**Acceptance Scenarios**:

1. **Dado** que o usuário está autenticado em qualquer página, **Quando** tocar no segundo ícone do
   navbar inferior, **Então** deve ser levado para a tela de despesas e o ícone deve ficar ativo.
2. **Dado** que existem despesas no mês atual, **Quando** a tela for exibida, **Então** as despesas
   devem estar separadas em vencidas, abertas e pagas, e dentro de cada grupo ordenadas pela data de
   vencimento mais próxima.
3. **Dado** uma despesa não paga com vencimento em até 5 dias a partir de hoje (inclusive), **Quando**
   a lista for exibida, **Então** ela deve aparecer com a situação "Vencimento próximo" dentro do grupo
   de abertas.
4. **Dado** uma despesa não paga com vencimento anterior a hoje, **Quando** a lista for exibida,
   **Então** ela deve aparecer no grupo de vencidas com nome, valor e vencimento em vermelho.
5. **Dado** uma despesa paga, **Quando** a lista for exibida, **Então** ela deve aparecer no grupo de
   pagas com opacidade menor que as demais.
6. **Dado** que os dados ainda estão sendo obtidos, **Quando** a tela for aberta, **Então** deve ser
   exibido um esqueleto de carregamento até que a lista esteja pronta.
7. **Dado** que não existe nenhuma despesa para os critérios atuais, **Quando** a tela for exibida,
   **Então** deve ser apresentada uma mensagem de lista vazia.

---

### User Story 2 - Buscar e filtrar despesas (Priority: P1)

O usuário digita um termo no campo de busca (com ícone de lupa à esquerda do placeholder) e toca no
botão de busca (apenas ícone de lupa) à direita. Ao lado do botão de busca há um ícone de filtros
que permite escolher critérios adicionais. Um indicador numérico sobre o ícone de filtros mostra
quantos filtros estão aplicados, e um pequeno ícone "x" no canto superior direito desse indicador
limpa todos os filtros.

**Why this priority**: Com despesas recorrentes a lista cresce todo mês; encontrar uma despesa
específica é essencial para o uso diário.

**Independent Test**: Com várias despesas cadastradas, realizar buscas por termo, aplicar filtros,
verificar o contador e limpar os filtros pelo "x", conferindo o resultado de cada ação.

**Acceptance Scenarios**:

1. **Dado** um termo digitado, **Quando** o usuário tocar no botão de busca ou pressionar Enter,
   **Então** a lista deve exibir somente despesas cujo nome, descrição ou tags contenham o termo,
   sem diferenciar maiúsculas/minúsculas.
2. **Dado** o campo de busca vazio, **Quando** o usuário acionar a busca, **Então** a lista deve ser
   exibida sem filtro de texto.
3. **Dado** que o usuário aplicou 2 filtros, **Quando** a tela for exibida, **Então** o indicador sobre
   o ícone de filtros deve mostrar "2".
4. **Dado** que existe ao menos um filtro aplicado, **Quando** o usuário tocar no "x" do indicador,
   **Então** todos os filtros devem ser removidos, o indicador deve desaparecer e a lista deve ser
   recarregada sem filtros.
5. **Dado** que nenhum filtro está aplicado, **Quando** a tela for exibida, **Então** o indicador e o
   "x" não devem ser exibidos.
6. **Dado** uma busca/filtro aplicado, **Quando** o usuário recarregar a página ou compartilhar o
   endereço, **Então** a mesma busca e os mesmos filtros devem continuar aplicados.

---

### User Story 3 - Despesas recorrentes aparecem nos meses seguintes (Priority: P2)

Uma despesa marcada como recorrente (ex.: aluguel) aparece em todos os meses a partir do mês inicial.
Quando o usuário a marca como paga em um mês, ela aparece como paga somente naquele mês; ao navegar
para o mês seguinte, a mesma despesa já está presente, em aberto, com o vencimento no mesmo dia do
mês.

**Why this priority**: É o principal ganho sobre uma lista simples, mas depende da listagem (P1).

**Independent Test**: Cadastrar uma despesa recorrente, registrar pagamento no mês atual e verificar
que no mês seguinte ela aparece em aberto, sem nenhuma ação manual de cópia.

**Acceptance Scenarios**:

1. **Dado** uma despesa recorrente com vencimento no dia 10, **Quando** o usuário visualizar qualquer
   mês a partir do mês inicial, **Então** a despesa deve aparecer com vencimento no dia 10 daquele mês.
2. **Dado** uma despesa recorrente paga no mês atual, **Quando** o usuário visualizar o mês seguinte,
   **Então** a despesa deve aparecer em aberto naquele mês e continuar como paga no mês atual.
3. **Dado** uma despesa recorrente com vencimento no dia 31, **Quando** o mês visualizado tiver menos
   dias, **Então** o vencimento deve ser o último dia daquele mês.
4. **Dado** uma despesa recorrente não paga em um mês passado, **Quando** o usuário visualizar aquele
   mês, **Então** ela deve aparecer como vencida.
5. **Dado** uma despesa não recorrente, **Quando** o usuário visualizar outro mês, **Então** ela deve
   aparecer apenas no mês do seu vencimento.

---

### User Story 4 - Operações de despesa disponíveis no servidor (Priority: P2)

As operações de criar, consultar, editar, excluir, marcar como paga e desmarcar pagamento existem no
servidor, com todas as regras de negócio aplicadas nele, prontas para serem conectadas à interface
em uma entrega futura. Cada falha retorna uma resposta padronizada com código de status, tipo de erro
e mensagem, apresentada ao usuário como notificação toast.

**Why this priority**: É pré-requisito das telas de cadastro/edição (fora de escopo), mas não gera
interação visível nesta entrega.

**Independent Test**: Invocar cada operação diretamente com entradas válidas e inválidas e verificar
o resultado e a estrutura de erro retornada.

**Acceptance Scenarios**:

1. **Dado** uma entrada sem nome, valor ou vencimento, **Quando** a criação for solicitada, **Então**
   deve ser retornado erro de validação indicando os campos obrigatórios ausentes.
2. **Dado** que já existe uma despesa chamada "Aluguel", **Quando** for solicitada a criação ou
   renomeação de outra despesa para "aluguel" ou " Aluguel ", **Então** deve ser retornado erro de
   conflito informando que o nome já está em uso.
3. **Dado** uma despesa já paga no mês, **Quando** for solicitado marcá-la como paga novamente,
   **Então** deve ser retornado erro de conflito e o registro de pagamento original deve permanecer.
4. **Dado** uma despesa marcada como paga pelo usuário A, **Quando** o usuário B solicitar desmarcar o
   pagamento, **Então** a operação deve ser aceita e a despesa deve voltar à situação calculada pelo
   vencimento.
5. **Dado** um usuário sem perfil de administrador, **Quando** solicitar a exclusão de uma despesa,
   **Então** deve ser retornado erro de permissão e a despesa deve permanecer.
6. **Dado** um usuário administrador, **Quando** solicitar a exclusão de uma despesa, **Então** a
   despesa deve ser removida da listagem.
7. **Dado** um usuário não autenticado, **Quando** qualquer operação for solicitada, **Então** deve ser
   retornado erro de autenticação.
8. **Dado** qualquer erro retornado por uma operação, **Quando** ele chegar à interface, **Então** deve
   ser exibida uma notificação toast com a mensagem, sem detalhes internos.

---

### Edge Cases

- Valor igual a zero, negativo ou com mais de 2 casas decimais é rejeitado.
- Nome contendo apenas espaços é tratado como ausente; espaços nas extremidades são ignorados na
  comparação de unicidade.
- Desmarcar pagamento de uma despesa que não está paga retorna erro de conflito.
- Operação sobre despesa inexistente (ou fora do escopo de acesso do usuário) retorna "não encontrado"
  sem revelar se o registro existe.
- Dois usuários tentando marcar a mesma despesa como paga ao mesmo tempo: apenas um pagamento é
  registrado; o outro recebe erro de conflito.
- Parâmetros de busca/filtro inválidos no endereço são ignorados e a lista é exibida sem eles.
- A virada de situação (aberta → vencimento próximo → vencida) é calculada pela data atual no fuso
  horário do usuário, sem depender de rotina agendada.
- Falha ao obter os dados exibe um estado de erro na tela com a mensagem padronizada.
- Exclusão de despesa recorrente remove a recorrência de meses futuros, mas não apaga o histórico de
  pagamentos já registrados sem confirmação explícita (regra de domínio vigente).

## Requirements *(mandatory)*

### Functional Requirements

**Dados e regras**

- **FR-001**: O sistema DEVE registrar despesas com identificador único próprio, nome, valor,
  data de vencimento, data de lançamento, indicador de recorrência, descrição opcional e tags opcionais.
- **FR-002**: Nome, valor e vencimento DEVEM ser obrigatórios; a data de lançamento DEVE assumir a
  data atual quando não informada.
- **FR-003**: O sistema DEVE impedir duas despesas com o mesmo nome no mesmo escopo de acesso,
  comparando sem diferenciar maiúsculas/minúsculas e ignorando espaços nas extremidades.
- **FR-004**: A situação de cada despesa em um mês DEVE ser uma de: **Aberta**, **Vencimento próximo**
  (não paga e vencimento em até 5 dias a partir de hoje, inclusive), **Vencida** (não paga e vencimento
  anterior a hoje) ou **Paga**. Somente o pagamento é registrado; as demais situações são derivadas
  do vencimento e da data atual.
- **FR-005**: Qualquer usuário autenticado com acesso à despesa DEVE poder marcá-la como paga ou
  desmarcar o pagamento, inclusive quando o pagamento foi registrado por outro usuário.
- **FR-006**: O sistema DEVE rejeitar marcar como paga uma despesa já paga naquele mês e desmarcar uma
  despesa que não está paga.
- **FR-007**: O sistema DEVE registrar quem marcou a despesa como paga e quando.
- **FR-008**: Somente usuários com perfil de administrador DEVEM poder excluir despesas.
- **FR-009**: Todas as validações e regras de negócio DEVEM ser executadas no servidor; o navegador
  não deve conter nem depender dessas regras para garantir sua aplicação.
- **FR-010**: Uma despesa recorrente DEVE ser cadastrada uma única vez e aparecer em todos os meses
  a partir do mês do seu primeiro vencimento. Para cada mês, somente o pagamento é registrado
  (despesa + mês de referência); as ocorrências mensais são calculadas na consulta, sem geração
  antecipada de registros nem rotina agendada. Alterar a despesa afeta os meses ainda não pagos;
  pagamentos já registrados permanecem inalterados.
- **FR-011**: Cada despesa DEVE pertencer a uma conta família. Somente membros dessa conta família
  podem visualizar, marcar/desmarcar pagamento e (se administradores) excluir suas despesas. A conta
  família é obtida no servidor a partir do usuário autenticado, nunca informada pelo navegador. A
  unicidade de nome (FR-003) e de tags vale dentro da conta família.

**Operações**

- **FR-012**: O sistema DEVE disponibilizar as operações de criar, listar, obter por identificador,
  editar, excluir, marcar como paga e desmarcar pagamento, todas exigindo usuário autenticado.
- **FR-013**: Toda operação que falhar DEVE retornar uma resposta de erro padronizada contendo código
  de status, tipo do erro (validação, não autenticado, sem permissão, não encontrado, conflito, erro
  interno) e mensagem legível em português, sem expor detalhes internos.
- **FR-014**: Mensagens de sucesso e de erro destinadas ao usuário DEVEM ser exibidas como
  notificações toast.

**Listagem e interface**

- **FR-015**: O segundo ícone do navbar inferior DEVE levar à tela de despesas, com rótulo acessível
  "Despesas", substituindo o destino atual "Dívidas".
- **FR-016**: A tela DEVE obter os dados já prontos do servidor na renderização, sem busca inicial
  disparada pelo navegador.
- **FR-017**: A ordenação inicial DEVE ser pelo vencimento mais próximo (crescente) dentro de cada
  grupo de situação.
- **FR-018**: A lista DEVE ser separada visualmente em grupos: Vencidas, Abertas (incluindo
  Vencimento próximo, identificado individualmente) e Pagas, nessa ordem; grupos vazios não aparecem.
- **FR-019**: Despesas pagas DEVEM ter opacidade reduzida; despesas vencidas DEVEM exibir suas
  informações em vermelho; demais cores seguem a paleta existente do projeto.
- **FR-020**: Cada item DEVE exibir, no mínimo, nome, valor em reais, data de vencimento, situação,
  tags e indicação de recorrência.
- **FR-021**: A tela DEVE ter campo de busca com ícone de lupa à esquerda do placeholder, botão de
  busca à direita contendo apenas o ícone de lupa (com rótulo acessível) e botão de filtros à direita
  do botão de busca.
- **FR-022**: Busca com campo vazio DEVE listar sem filtro de texto.
- **FR-023**: Os filtros disponíveis DEVEM ser: mês de referência (padrão: mês atual), situação
  (uma ou mais), tags (uma ou mais) e recorrência (recorrentes / não recorrentes). O mês de referência
  padrão não conta como filtro aplicado.
- **FR-024**: Um indicador sobre o botão de filtros DEVE mostrar a quantidade de filtros aplicados
  (termo de busca não conta) e, quando houver ao menos um, um ícone "x" no canto superior direito
  do indicador DEVE limpar todos os filtros.
- **FR-025**: Busca e filtros DEVEM ser refletidos no endereço da página, permitindo recarregar e
  compartilhar a mesma visão.
- **FR-026**: A tela DEVE exibir esqueleto de carregamento durante a obtenção dos dados, estado vazio
  quando não houver resultados e estado de erro quando a obtenção falhar.
- **FR-027**: A tela DEVE seguir a abordagem mobile-first e ser acessível por teclado e leitores de
  tela (rótulos nos botões só com ícone, foco visível).

### Key Entities

- **Despesa**: compromisso de pagamento. Atributos: identificador (chave primária), nome (único na
  conta família), valor (positivo, 2 casas decimais, em reais), vencimento, lançamento, recorrente (sim/não),
  descrição, tags, conta família, autor, datas de criação/atualização.
- **Pagamento da despesa (ocorrência)**: registro de que a despesa foi paga em um mês de referência.
  Atributos: despesa, mês de referência, data do pagamento, usuário que marcou. No máximo um por
  despesa e mês. Sua ausência significa que a despesa não está paga naquele mês.
- **Tag**: rótulo livre para marcação e filtragem. Uma despesa pode ter várias tags e uma tag pode
  estar em várias despesas; nomes únicos na conta família, sem diferenciar maiúsculas/minúsculas.
- **Conta família**: entidade existente que agrupa usuários (membros); é a dona das despesas e tags.
- **Usuário**: entidade existente; o perfil (usuário/administrador) determina a permissão de exclusão.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário identifica quais despesas estão vencidas ou próximas do vencimento no mês
  em até 5 segundos após abrir a tela.
- **SC-002**: A lista de um mês com até 200 despesas é exibida completa em até 2 segundos em conexão
  móvel comum, com esqueleto de carregamento visível durante a espera.
- **SC-003**: 100% das tentativas que violam regras (campos obrigatórios, nome duplicado, pagamento
  duplicado, exclusão sem permissão) são rejeitadas mesmo quando enviadas sem passar pela interface.
- **SC-004**: 100% das respostas de erro contêm código de status, tipo e mensagem, e nenhuma expõe
  detalhes internos do sistema.
- **SC-005**: Uma despesa recorrente paga em um mês aparece em aberto no mês seguinte em 100% dos
  casos, sem ação manual.
- **SC-006**: Buscar ou limpar filtros exige no máximo 2 toques.

## Assumptions

- O "segundo ícone" do navbar hoje aponta para "Dívidas"; ele passa a representar "Despesas". Dívidas
  continuarão acessíveis pelo menu de criação e terão entrada própria definida em outra entrega.
- O usuário autenticado pertence a uma conta família; se pertencer a mais de uma, é usada a primeira
  em que ingressou até existir seleção de conta. Usuário sem conta família vê a lista vazia e não
  pode operar despesas.
- Despesas compartilhadas por conta família exigem atualizar a constituição (princípio IV) e
  `agents/DOMINIO.md` para "todo dado financeiro pertence a um usuário ou a uma conta família".
- "Administrador" é o perfil de administrador já existente no cadastro de usuários.
- Recorrência inicial é apenas mensal, no mesmo dia do vencimento original, sem data de término
  (encerrar recorrência fica para a entrega de edição).
- Moeda única: real (BRL). Fuso horário de referência para datas e situações: America/Sao_Paulo.
- "Lançamento" é a data em que a despesa foi registrada/considerada, não a data de pagamento.
- Tags são criadas livremente no momento de marcar uma despesa; não há tela de gestão de tags.
- A biblioteca de notificações toast solicitada (react-hot-toast) será instalada e usada para todas
  as mensagens ao usuário.
- Fora de escopo: modal/tela de adicionar despesa e as rotinas de interação da interface para
  adicionar, editar, excluir e alterar situação; as operações existem no servidor, mas não são
  acionadas por botões nesta entrega.
- O esquema de dados deve ficar pronto para migração versionada, sem aplicar mudanças manuais no banco.
