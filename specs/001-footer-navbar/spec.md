# Feature Specification: Footer Navigation

**Feature Branch**: `001-footer-navbar`

**Created**: 2026-09-28

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegar entre seções principais (Priority: P1)

O usuário está em qualquer página do sistema e precisa se mover para outra seção principal. Ele toca
em um dos ícones do navbar fixo na parte inferior da tela e é levado para a rota correspondente. O
item tocado fica destacado visualmente para indicar a seção ativa.

**Why this priority**: É o comportamento fundamental do componente. Sem navegação funcional com
estado ativo, as demais histórias não fazem sentido.

**Independent Test**: Pode ser testado completamente ao navegar entre /, /dividas, /lista-de-desejos
e /configuracoes e verificar que o item correto fica ativo em cada rota.

**Acceptance Scenarios**:

1. **Dado** que o usuário está em qualquer página, **Quando** tocar no item "Dívidas", **Então** deve
   ser navegado para /dividas e o item "Dívidas" deve apresentar estado ativo.
2. **Dado** que o usuário está em /dividas, **Quando** o navbar for renderizado, **Então** o item
   "Dívidas" deve estar ativo e os demais inativos.
3. **Dado** que o usuário está na página correspondente a um item, **Quando** tocar nesse mesmo item,
   **Então** nenhuma navegação ou ação adicional deve ocorrer.
4. **Dado** qualquer viewport mobile, **Quando** o navbar for renderizado, **Então** deve existir
   exatamente cinco posições na ordem: Início, Dívidas, Adicionar, Lista de desejos, Configurações.

---

### User Story 2 - Criar um novo registro pelo menu flutuante (Priority: P2)

O usuário quer registrar uma nova entrada, despesa, dívida ou desejo. Ele toca no botão central
circular do navbar, que exibe um menu flutuante com as quatro opções de criação. Ao selecionar uma
opção, é direcionado para a página de criação correspondente.

**Why this priority**: A criação de registros é a ação mais frequente do sistema. O acesso direto
pelo navbar elimina etapas de navegação.

**Independent Test**: Pode ser testado completamente ao abrir o menu, selecionar cada uma das quatro
opções e verificar que o usuário chega na rota correta com o menu fechado.

**Acceptance Scenarios**:

1. **Dado** que o menu esteja fechado, **Quando** o usuário tocar no botão +, **Então** o menu deve
   aparecer acima do navbar e o botão deve mudar visualmente para ×.
2. **Dado** que o menu esteja aberto, **Quando** o usuário tocar no ×, **Então** o menu deve
   desaparecer e o botão deve retornar para +.
3. **Dado** que o menu esteja aberto, **Quando** o usuário selecionar "Nova entrada", **Então** o
   menu deve ser fechado e o usuário deve ser navegado para /entradas/nova.
4. **Dado** que o menu esteja aberto, **Quando** o usuário selecionar "Nova despesa", **Então** o
   menu deve ser fechado e o usuário deve ser navegado para /despesas/nova.
5. **Dado** que o menu esteja aberto, **Quando** o usuário selecionar "Nova dívida", **Então** o
   menu deve ser fechado e o usuário deve ser navegado para /dividas/nova.
6. **Dado** que o menu esteja aberto, **Quando** o usuário selecionar "Novo desejo", **Então** o
   menu deve ser fechado e o usuário deve ser navegado para /lista-de-desejos/novo.
7. **Dado** que o menu esteja aberto, **Quando** o usuário tocar fora do menu e fora do botão
   central, **Então** o menu deve ser fechado sem overlay sobre o conteúdo.
8. **Dado** que o menu esteja aberto e o usuário tocar em um item de navegação do navbar, **Quando**
   a ação for concluída, **Então** o menu deve ser fechado e a navegação selecionada deve ser
   executada.
9. **Dado** que o usuário entre em uma nova página, **Quando** o navbar for renderizado, **Então**
   o menu deve iniciar sempre fechado.

---

### User Story 3 - Navbar fixo durante scroll e em dispositivos com safe area (Priority: P3)

O usuário está rolando uma página com conteúdo extenso ou usando um dispositivo com área de gesto
inferior (ex: iPhone sem botão home). O navbar permanece visível e fixo na parte inferior durante
toda a rolagem, e seu conteúdo não fica sobreposto pela área de gesto do dispositivo.

**Why this priority**: Garante usabilidade em condições reais de uso. Depende da estrutura
estabelecida nas histórias anteriores.

**Independent Test**: Pode ser testado ao rolar uma página longa e verificar visibilidade do navbar;
e em dispositivo com safe area para verificar que os ícones não ficam ocultos.

**Acceptance Scenarios**:

1. **Dado** que o usuário esteja rolando uma página, **Quando** a posição de scroll mudar em qualquer
   direção, **Então** o navbar deve continuar visível e fixo na parte inferior.
2. **Dado** um dispositivo com área segura inferior, **Quando** o navbar for renderizado, **Então**
   seu conteúdo não deve ficar sobreposto pela área de gesto do dispositivo.
3. **Dado** que o usuário esteja em uma página de criação (/entradas/nova, /despesas/nova,
   /dividas/nova, /lista-de-desejos/novo), **Quando** a página for renderizada, **Então** o navbar
   deve continuar disponível.
4. **Dado** qualquer viewport mobile, **Quando** o navbar for renderizado, **Então** ele deve ocupar
   100% da largura da viewport sem gerar scroll horizontal.

---

### Edge Cases

- O que acontece quando o usuário está em uma rota que não corresponde a nenhum dos quatro itens de
  navegação (ex: /entradas/nova)? Nenhum item deve apresentar estado ativo.
- O que acontece se o usuário abrir o menu e imediatamente navegar por um item do navbar? O menu
  fecha e a navegação ocorre normalmente.
- O que acontece em dispositivos sem safe area inferior? O navbar deve funcionar normalmente com
  sua altura base de 64px.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O navbar DEVE possuir exatamente cinco posições, na ordem: Início (/), Dívidas
  (/dividas), Adicionar (ação), Lista de desejos (/lista-de-desejos), Configurações (/configuracoes).
- **FR-002**: Os quatro itens de navegação DEVEM apresentar somente ícone, sem texto visível.
- **FR-003**: O navbar DEVE ocupar 100% da largura da viewport sem max-width e sem gerar overflow
  horizontal.
- **FR-004**: O navbar DEVE permanecer fixo na parte inferior durante toda a rolagem, sem comportamento
  de ocultar ao rolar para baixo e mostrar ao rolar para cima.
- **FR-005**: A altura base do navbar DEVE ser 64px, acrescida de safe-area-inset-bottom.
- **FR-006**: O conteúdo das páginas DEVE possuir espaço inferior suficiente para não ficar oculto
  atrás do navbar.
- **FR-007**: Os cinco itens DEVEM ocupar slots equivalentes dentro do navbar. O botão central DEVE
  ser circular com 56 × 56px e visualmente elevado em relação à superfície do navbar.
- **FR-008**: O item correspondente à rota atual DEVE apresentar estado ativo usando a cor primária
  existente no projeto. Os demais DEVEM usar os tokens de cor existentes. Nenhuma cor nova DEVE ser
  introduzida exclusivamente para esta feature.
- **FR-009**: O botão central NÃO DEVE possuir estado ativo.
- **FR-010**: Ao tocar em um item de navegação que corresponde à página atual, NENHUMA ação adicional
  DEVE ser executada.
- **FR-011**: O botão central DEVE funcionar como toggle: estado fechado exibe +, estado aberto exibe
  ×. A transição entre + e × DEVE ser animada. O menu DEVE iniciar fechado ao entrar em qualquer
  página.
- **FR-012**: O menu flutuante DEVE ser exibido acima do navbar como uma única superfície visual com
  fundo nos tokens existentes, bordas arredondadas e sombra, sem divisórias entre opções e sem
  animação de entrada ou saída.
- **FR-013**: Cada opção do menu DEVE possuir ícone, texto e área de interação de no mínimo 48px de
  altura. As quatro opções DEVEM ser: Nova entrada → /entradas/nova; Nova despesa → /despesas/nova;
  Nova dívida → /dividas/nova; Novo desejo → /lista-de-desejos/novo.
- **FR-014**: Ao selecionar uma opção do menu, o menu DEVE ser fechado e o usuário DEVE ser navegado
  para a rota correspondente.
- **FR-015**: Tocar fora do menu e fora do botão central DEVE fechar o menu. NÃO DEVE existir overlay
  sobre o conteúdo.
- **FR-016**: Se o menu estiver aberto e o usuário selecionar um item de navegação do navbar, o menu
  DEVE ser fechado e a navegação DEVE ser executada.
- **FR-017**: O navbar DEVE permanecer visível nas páginas de criação (/entradas/nova, /despesas/nova,
  /dividas/nova, /lista-de-desejos/novo).

### Key Entities

- **Navbar**: barra de navegação fixa com cinco slots. Contém quatro itens de navegação e um botão
  de ação central.
- **Item de navegação**: slot com ícone que representa uma rota principal. Possui estado ativo/inativo
  baseado na rota atual.
- **Botão de ação**: slot central circular que controla a visibilidade do menu flutuante. Sem estado
  ativo.
- **Menu flutuante**: superfície visual posicionada acima do navbar que lista as quatro ações de
  criação disponíveis. Controlado pelo botão de ação.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário consegue navegar entre qualquer uma das quatro seções principais em no máximo
  um toque, a partir de qualquer página do sistema.
- **SC-002**: O usuário consegue iniciar a criação de qualquer um dos quatro tipos de registro em no
  máximo dois toques a partir de qualquer página.
- **SC-003**: O navbar permanece visível em 100% das páginas do sistema, incluindo durante scroll e
  nas páginas de criação.
- **SC-004**: Em dispositivos com área segura inferior, nenhum elemento interativo do navbar fica
  inacessível pela sobreposição da área de gesto.
- **SC-005**: O estado ativo do item de navegação é atualizado corretamente em 100% das transições
  de rota entre as seções principais.
- **SC-006**: O menu flutuante abre e fecha corretamente em todos os cenários definidos (botão ×,
  clique fora, seleção de ação, navegação pelo navbar).

## Assumptions

- A feature é exclusivamente mobile; não há requisito de exibição ou comportamento em viewports
  desktop.
- Acessibilidade (ARIA, navegação por teclado, leitores de tela) está fora do escopo desta spec.
- Os tokens de cor primária e os demais tokens visuais necessários já existem no projeto e serão
  reutilizados sem modificação.
- As páginas de destino (/entradas/nova, /despesas/nova, /dividas/nova, /lista-de-desejos/novo,
  /dividas, /lista-de-desejos, /configuracoes) não precisam existir para que o navbar seja
  implementado e validado; a navegação para rotas ainda não implementadas é aceitável durante o
  desenvolvimento desta feature.
- O sistema de roteamento do projeto já é capaz de fornecer a rota atual para que o estado ativo
  seja determinado pelo navbar.
