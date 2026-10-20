# Feature Specification: Tags em Gastos

**Feature Branch**: `009-tags-gastos`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "TAGS EM GASTOS - Adicionar suporte a tags nos gastos (dinheiro e cartão). Nova coluna tagId em Gasto (FK → Tag, nullable). Nova coluna tipo em Tag (enum: DESPESAS, GASTOS). Tags iniciais: lazer, gasolina, saúde, alimentação, outros. Modal criar gasto: select dropdown com tags de tipo GASTOS (opcional). Tags compartilhadas entre despesas e gastos (não cascata delete)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Categorizar um gasto ao registrá-lo (Priority: P1)

O usuário abre o modal de criar gasto e, opcionalmente, seleciona uma tag para categorizar o gasto
antes de confirmar. A lista de tags exibida contém apenas as opções relevantes para gastos (lazer,
gasolina, saúde, alimentação, outros). Ao confirmar, o gasto é registrado com a tag selecionada e
essa categoria aparece junto ao gasto na listagem e no dashboard.

**Why this priority**: Categorizar no ato do registro é o fluxo principal e o que gera mais valor
imediato — sem isso o usuário não consegue usar tags em novos gastos.

**Independent Test**: Abrir o modal de gasto, selecionar a tag "Gasolina", preencher os demais
campos e confirmar. Verificar que o gasto registrado exibe "Gasolina" na listagem de gastos e no
dashboard.

**Acceptance Scenarios**:

1. **Dado** que o modal de criar gasto está aberto, **Quando** o usuário visualizar o campo de tag,
   **Então** deve aparecer um seletor com as opções: lazer, gasolina, saúde, alimentação e outros —
   nenhuma tag de categoria "Despesas" deve ser exibida.
2. **Dado** que o usuário selecionou uma tag no modal, **Quando** confirmar o gasto,
   **Então** o gasto deve ser registrado com a tag associada e a categoria deve ser visível na
   listagem de gastos imediatamente após o fechamento do modal.
3. **Dado** que o usuário não selecionou nenhuma tag no modal, **Quando** confirmar o gasto,
   **Então** o gasto deve ser registrado normalmente sem tag, e isso não deve ser tratado como erro.
4. **Dado** que o gasto foi registrado com uma tag, **Quando** o usuário visualizar o dashboard,
   **Então** o gasto deve exibir a tag associada junto às demais informações do registro.

---

### User Story 2 - Registrar gasto com cartão e tag (Priority: P1)

O usuário registra um gasto via cartão de crédito e, opcionalmente, associa uma tag. O
comportamento de tags é idêntico ao pagamento em dinheiro: a seleção é opcional, as opções são as
mesmas (lazer, gasolina, saúde, alimentação, outros) e a tag aparece no histórico junto ao cartão
utilizado.

**Why this priority**: A feature de tags deve funcionar de forma uniforme independente da forma de
pagamento — não ter suporte no cartão seria uma lacuna imediata percebida pelo usuário.

**Independent Test**: Registrar um gasto com cartão sem tag e verificar que salva normalmente.
Registrar outro gasto com cartão e a tag "Alimentação" e verificar que a tag aparece na listagem.

**Acceptance Scenarios**:

1. **Dado** que a forma de pagamento é "Cartão", **Quando** o usuário visualizar o campo de tag,
   **Então** as mesmas opções de tag disponíveis para "Dinheiro" devem estar presentes.
2. **Dado** que o gasto via cartão foi confirmado com uma tag, **Quando** a listagem de gastos for
   exibida, **Então** a tag deve aparecer junto ao nome do gasto e ao cartão utilizado.
3. **Dado** que o gasto via cartão foi confirmado sem tag, **Quando** a listagem for exibida,
   **Então** o gasto deve aparecer sem tag, sem mensagem de erro ou aviso.

---

### User Story 3 - Visualizar e filtrar gastos por tag no histórico (Priority: P2)

O usuário acessa o histórico de transações e consegue identificar visualmente a tag de cada gasto.
As tags aparecem como rótulos coloridos ou textuais junto a cada linha do histórico, facilitando a
leitura de onde o dinheiro foi gasto por categoria.

**Why this priority**: A visualização no histórico é o que torna o sistema de tags útil para
análise de gastos — sem ela as tags existem apenas no registro, sem benefício prático.

**Independent Test**: Registrar três gastos com tags diferentes (lazer, gasolina, alimentação) e
dois sem tag. No histórico, verificar que cada gasto exibe sua tag corretamente e os dois sem tag
aparecem sem rótulo.

**Acceptance Scenarios**:

1. **Dado** que o histórico de transações é exibido, **Quando** há gastos com tag associada,
   **Então** cada gasto deve exibir o nome da tag como parte de sua linha no histórico.
2. **Dado** que um gasto não tem tag, **Quando** o histórico for exibido, **Então** a linha desse
   gasto não deve exibir nenhum rótulo de tag, sem espaço reservado vazio ou traço.
3. **Dado** que gastos de tipos diferentes (dinheiro e cartão) têm tags, **Quando** o histórico
   for exibido, **Então** ambos devem mostrar suas tags de forma consistente, sem diferença visual
   por forma de pagamento.

---

### User Story 4 - Editar a tag de um gasto existente (Priority: P2)

O usuário acessa um gasto já registrado — seja pelo gesto de "arrastar para revelar opções" no
dashboard ou pela tela de edição — e consegue alterar ou remover a tag associada sem precisar
recriar o gasto.

**Why this priority**: Tags atribuídas incorretamente devem ser corrigíveis; sem edição o usuário
precisaria apagar e recriar o gasto para corrigir a categoria.

**Independent Test**: Registrar um gasto com tag "Lazer". Editar o gasto e alterar a tag para
"Alimentação". Verificar que a tag exibida no histórico muda para "Alimentação". Em seguida,
remover a tag e verificar que o gasto volta a aparecer sem tag.

**Acceptance Scenarios**:

1. **Dado** que o usuário acessa a edição de um gasto com tag, **Quando** o formulário de edição
   for exibido, **Então** a tag atual deve estar pré-selecionada no seletor.
2. **Dado** que o usuário altera a tag no formulário de edição, **Quando** salvar,
   **Então** o gasto deve refletir a nova tag imediatamente no histórico e no dashboard.
3. **Dado** que o usuário remove a tag (desmarca a seleção), **Quando** salvar,
   **Então** o gasto deve ficar sem tag associada — sem erro ou aviso.
4. **Dado** que o usuário aciona o gesto de arrastar para revelar opções no dashboard,
   **Quando** selecionar a opção de editar tag, **Então** o seletor de tag deve ser exibido
   com a tag atual pré-selecionada para edição rápida.

---

### Edge Cases

- O que acontece se uma tag for excluída enquanto gastos já a referenciam? A exclusão da tag não
  deve apagar os gastos — os gastos afetados ficam sem tag (campo anulado automaticamente), mas
  permanecem íntegros.
- O que acontece se o usuário tentar associar ao gasto uma tag do tipo "Despesas"? O sistema deve
  rejeitar a operação com mensagem de erro clara — apenas tags do tipo "Gastos" são aceitas para
  gastos.
- O que acontece se não houver tags cadastradas do tipo "Gastos"? O seletor deve ser exibido vazio
  (ou com mensagem informativa) e o campo deve permanecer opcional — o gasto pode ser registrado
  sem tag.
- O que acontece se duas tags tiverem o mesmo nome mas tipos diferentes? Devem ser tratadas como
  entidades distintas; a filtragem por tipo garante que apenas a correta apareça em cada contexto.
- O que acontece ao excluir uma tag que está em uso por gastos e por despesas simultaneamente? A
  operação deve anular o vínculo em ambas as entidades sem exclusão em cascata.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE suportar a associação opcional de uma tag a qualquer gasto, independente
  da forma de pagamento (dinheiro ou cartão).
- **FR-002**: O sistema DEVE distinguir tags por tipo: tags do tipo "Gastos" são associáveis apenas a
  gastos; tags do tipo "Despesas" são associáveis apenas a despesas; as duas categorias coexistem na
  mesma base de tags, mas o filtro deve ser automático por contexto.
- **FR-003**: O modal de criar gasto DEVE exibir um seletor de tag contendo exclusivamente tags do
  tipo "Gastos"; tags do tipo "Despesas" não devem aparecer.
- **FR-004**: O seletor de tag no modal DEVE ser opcional — ausência de seleção não deve impedir o
  registro do gasto.
- **FR-005**: O sistema DEVE disponibilizar, por padrão, as seguintes tags do tipo "Gastos" para
  novas instalações ou primeiros acessos: lazer, gasolina, saúde, alimentação, outros.
- **FR-006**: O sistema DEVE rejeitar a associação de uma tag ao gasto quando a tag indicada não
  existir ou não for do tipo "Gastos", retornando mensagem de erro ao usuário.
- **FR-007**: O histórico de transações DEVE exibir a tag associada a cada gasto — ou nenhum rótulo
  quando o gasto não tiver tag.
- **FR-008**: O dashboard DEVE exibir a tag de cada gasto listado, com tratamento visual consistente
  entre gastos com e sem tag.
- **FR-009**: O formulário de edição de gasto DEVE permitir alterar ou remover a tag associada, com
  a tag atual pré-selecionada ao abrir.
- **FR-010**: A exclusão de uma tag não DEVE excluir em cascata os gastos ou despesas vinculados —
  os registros afetados devem ter o campo de tag anulado automaticamente.
- **FR-011**: O `usuarioId` e o `contaFamiliaId` DEVEM ser obtidos exclusivamente da sessão
  autenticada no servidor — nunca recebidos como entrada do cliente, inclusive na associação de tag.
- **FR-012**: O gesto de "arrastar para revelar opções" nos gastos do dashboard DEVE incluir uma
  opção de edição rápida da tag.

### Key Entities *(include if feature involves data)*

- **Tag**: representa uma categoria reutilizável. Atributos: nome (texto único por tipo), tipo
  (Gastos | Despesas). Uma tag pode estar associada a múltiplos gastos ou despesas; sua exclusão
  não remove esses registros.
- **Gasto**: já existente na plataforma. Recebe um novo atributo opcional: referência à tag
  associada. Quando presente, indica a categoria do gasto; quando ausente, o gasto é
  "sem categoria".
- **Tipo de Tag** (enumeração): determina em qual contexto a tag pode ser usada — "Gastos" para
  categorizar gastos, "Despesas" para categorizar despesas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário consegue categorizar um gasto com uma tag em menos de 5 segundos a partir
  do campo de tag no modal — incluindo abertura do seletor e seleção da opção.
- **SC-002**: 100% dos gastos que recebem uma tag a exibem corretamente no histórico e no dashboard
  imediatamente após o registro, sem recarregamento de página.
- **SC-003**: 0% de gastos com tag do tipo "Despesas" associada — o filtro por tipo deve ser
  infalível em todas as vias de entrada (modal, edição, API).
- **SC-004**: O fluxo de registro de um gasto sem tag (campo opcional ignorado) deve ter 100% de
  taxa de sucesso — nenhuma regressão nos fluxos existentes de criação de gastos.
- **SC-005**: A exclusão de qualquer tag preserva 100% dos gastos e despesas vinculados, sem
  exclusão em cascata ou perda de dados financeiros.
- **SC-006**: As 5 tags iniciais de gastos (lazer, gasolina, saúde, alimentação, outros) devem
  estar disponíveis para seleção em qualquer conta família, desde o primeiro acesso à funcionalidade.

## Assumptions

- O usuário já está autenticado e pertence a uma conta família ativa; o fluxo de autenticação está
  fora do escopo desta feature.
- As tags são globais à plataforma (não por conta família) — qualquer membro de qualquer conta
  acessa o mesmo conjunto de tags. Caso tags precisem ser por conta família, isso será escopo de
  uma spec separada.
- O campo de tag no modal de criar gasto é exibido para ambas as formas de pagamento (dinheiro e
  cartão), sem distinção.
- A feature de tags em despesas (tipo "Despesas") já existe ou estará em spec separada; esta spec
  cobre apenas a extensão do sistema de tags para gastos.
- O seletor de tag usa uma lista simples (dropdown/select) — busca textual ou multi-seleção ficam
  fora do escopo desta versão.
- Tags não têm cor ou ícone customizável nesta versão — apenas nome e tipo.
- Os 5 valores iniciais de tags de gastos são fixos para o seed; a gestão (criar/editar/excluir
  tags) é considerada funcionalidade administrativa existente ou escopo futuro.
- Valores monetários continuam sendo armazenados e operados como Decimal — a adição de tags não
  altera essa regra.
