# Tasks: Footer Navigation

**Input**: Design documents de `specs/001-footer-navbar/`

**Documentos consultados**: plan.md, spec.md, data-model.md, contracts/navbar-rodape.md,
research.md, quickstart.md, constitution.md

**Testes**: não solicitados na spec — nenhuma task de teste gerada.

**Organização**: tasks agrupadas por user story para permitir implementação e validação
independente de cada história.

## Formato: `[ID] [P?] [Story] Descrição com caminho do arquivo`

- **[P]**: pode executar em paralelo (arquivos diferentes, sem dependência de tasks incompletas)
- **[Story]**: user story à qual a task pertence (US1, US2, US3)

---

## Phase 1: Setup

**Objetivo**: instalar dependências e configurar metadados globais necessários para a feature.

- [x] T001 Instalar `lucide-react` como dependência em `package.json` (`npm install lucide-react`)
- [x] T002 Adicionar `viewport: { width: 'device-width', initialScale: 1, viewportFit: 'cover' }` ao objeto `metadata` em `app/layout.tsx` para habilitar `env(safe-area-inset-bottom)` no iOS

---

## Phase 2: Fundacional (Pré-requisitos bloqueantes)

**Objetivo**: criar a estrutura mínima que permite integrar o navbar e garante que o conteúdo
das páginas não fique oculto atrás dele.

⚠️ **CRÍTICO**: nenhuma user story pode ser validada em navegador antes desta fase estar completa.

- [x] T003 Criar `src/widgets/navbar-rodape/ui/NavbarRodape.tsx` como Client Component vazio (`"use client"; export default function NavbarRodape() { return null; }`) e exportar de `src/widgets/navbar-rodape/index.ts`
- [x] T004 Criar `app/(app)/layout.tsx` — Server Component que importa `NavbarRodape` de `@/src/widgets/navbar-rodape`, envolve `{children}` em `<main className="flex-1 pb-[calc(64px+env(safe-area-inset-bottom))]">` e renderiza `<NavbarRodape />` abaixo

**Checkpoint**: estrutura de layout pronta — as user stories podem começar em paralelo.

---

## Phase 3: User Story 1 — Navegação rápida entre seções (Priority: P1) 🎯 MVP

**Objetivo**: navbar visível com 5 slots, itens de rota com ícones, estado ativo baseado na rota
atual e navegação funcional entre as quatro seções principais.

**Teste independente**: navegar entre `/`, `/dividas`, `/lista-de-desejos` e `/configuracoes`
confirmando que o item correto fica na cor primária e que a navegação ocorre ao tocar nos ícones.

- [x] T005 [US1] Implementar estrutura visual de `src/widgets/navbar-rodape/ui/NavbarRodape.tsx`: `position: fixed; bottom: 0; left: 0; right: 0`, largura 100% sem `max-width`, altura interna `h-16` (64px), `bg-card`, `border-t border-borda`, `z-50`, sem overflow horizontal — 5 slots com `grid grid-cols-5` ou `flex` com `flex-1` em cada slot
- [x] T006 [P] [US1] Adicionar tipos `ItemNavegacao` e array de configuração dos 4 itens de rota em `src/widgets/navbar-rodape/ui/NavbarRodape.tsx`: `{ rotulo, rota, icone }` para Início (`/`), Dívidas (`/dividas`), Lista de desejos (`/lista-de-desejos`) e Configurações (`/configuracoes`) com ícones `lucide-react`
- [x] T007 [US1] Renderizar os 4 itens de navegação em `src/widgets/navbar-rodape/ui/NavbarRodape.tsx` usando `<Link>` do `next/link` e `usePathname` do `next/navigation` — aplicar `text-primaria` ao item ativo (match exato para `/`; `startsWith` para demais), `text-texto-sec` aos inativos; slot central (posição 3) renderiza `<div className="flex-1" />` como placeholder para US2

**Checkpoint**: US1 completa — navbar fixo com navegação e estado ativo funcionando.

---

## Phase 4: User Story 2 — Criar registro pelo menu flutuante (Priority: P2)

**Objetivo**: botão central circular com toggle + → ×, menu flutuante com 4 opções de criação,
fechamento por botão / clique externo / seleção de opção / navegação pelo navbar.

**Teste independente**: abrir o menu com +, selecionar cada uma das 4 opções e confirmar
navegação para a rota correta com o menu fechado.

- [x] T008 [P] [US2] Criar `src/widgets/navbar-rodape/ui/BotaoAcao.tsx` — Client Component: botão circular `w-14 h-14` (56×56px), `bg-primaria text-white rounded-full shadow-lg`, renderiza ícone `Plus` quando `aberto=false` e `X` quando `aberto=true`; aceita props `aberto: boolean` e `onToggle: () => void`; transição animada entre os ícones com CSS `transition-transform duration-200` ou `rotate`
- [x] T009 [P] [US2] Criar `src/widgets/navbar-rodape/ui/MenuAcoes.tsx` — Client Component: painel flutuante `absolute bottom-full` posicionado acima do navbar, `bg-card rounded-xl shadow-lg`, sem animação de entrada/saída, visível apenas quando `aberto=true`; 4 opções com ícone + texto + `min-h-[48px]` + `cursor-pointer`; aceita props `aberto: boolean`, `onFechar: () => void`; usa `useRouter` do `next/navigation` para navegar e chamar `onFechar` após
- [x] T010 [US2] Integrar `BotaoAcao` e `MenuAcoes` em `src/widgets/navbar-rodape/ui/NavbarRodape.tsx`: adicionar `const [menuAberto, setMenuAberto] = useState(false)`; colocar `<BotaoAcao>` + `<MenuAcoes>` no slot central; implementar detecção de clique externo com `useEffect` + `useRef` (dois refs: menu e botão) usando `document.addEventListener('pointerdown', handler)` — fechar menu sem overlay; fechar menu quando `<Link>` de navegação é ativado (passar `onClick={() => setMenuAberto(false)}` nos itens de rota)

**Checkpoint**: US2 completa — menu flutuante totalmente funcional com todos os comportamentos
de abertura e fechamento.

---

## Phase 5: User Story 3 — Navbar fixo durante scroll e safe area (Priority: P3)

**Objetivo**: garantir que o navbar permanece visível durante a rolagem e que seu conteúdo não
fica sobreposto pela área de gesto inferior em dispositivos iOS/Android.

**Teste independente**: em dispositivo com safe area (ou emulação), rolar página longa e
confirmar que o navbar permanece visível e que os ícones não ficam ocluídos.

- [x] T011 [US3] Aplicar `style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}` no elemento raiz do navbar em `src/widgets/navbar-rodape/ui/NavbarRodape.tsx` (o wrapper `<nav>` fixo), mantendo a área de ícones no container `h-16` interno — o background do navbar se estende até a borda do dispositivo enquanto os ícones ficam acima da safe area
- [x] T012 [P] [US3] Verificar em `app/(app)/layout.tsx` que o `pb-[calc(64px+env(safe-area-inset-bottom))]` no `<main>` está correto e confirmar em `app/layout.tsx` que `viewport.viewportFit: 'cover'` (T002) está presente — executar cenários AC-13 e AC-14 do `specs/001-footer-navbar/quickstart.md`

**Checkpoint**: US3 completa — todas as 3 user stories funcionando; comportamento validado em
dispositivos com e sem safe area.

---

## Phase 6: Polish e verificação final

**Objetivo**: verificar qualidade, lint, build e confirmar que nenhuma cor nova foi introduzida.

- [x] T013 [P] Executar `npm run lint` e `npm run build` sem erros; corrigir qualquer problema de TypeScript ou ESLint nos arquivos criados/modificados
- [x] T014 [P] Executar validação manual completa dos 15 ACs de `specs/001-footer-navbar/quickstart.md` no navegador com emulação mobile; confirmar que nenhum valor de cor hardcoded foi introduzido (todos os valores de cor devem referenciar variáveis CSS de `app/globals.css`)

---

## Dependencies & Execution Order

### Dependências entre fases

- **Setup (Phase 1)**: sem dependências — pode iniciar imediatamente
- **Fundacional (Phase 2)**: depende do Setup (T001 antes de T003) — **bloqueia todas as user stories**
- **User Stories (Phases 3–5)**: dependem da Phase 2 completa; podem ser executadas em sequência (P1 → P2 → P3)
- **Polish (Phase 6)**: depende de todas as user stories desejadas estarem completas

### Dependências dentro de cada user story

```
US1: T005 → T006 [P] → T007 (T005 e T006 podem iniciar juntas, T007 depende das duas)
US2: T008 [P] e T009 [P] → T010 (T008 e T009 independentes entre si, T010 depende das duas)
US3: T011 e T012 [P] (independentes entre si, mas dependem de US1 e US2 completas)
```

### Dependências entre user stories

- **US1 (P1)**: pode iniciar após Phase 2 — sem dependências de outras stories
- **US2 (P2)**: pode iniciar após Phase 2 — integra com US1 via NavbarRodape.tsx
- **US3 (P3)**: pode iniciar após Phase 2 — ajustes de CSS independentes, mas melhor validar após US1/US2

---

## Parallel Example: User Story 2

```
# T008 e T009 podem ser implementadas simultaneamente (arquivos separados):
T008: src/widgets/navbar-rodape/ui/BotaoAcao.tsx
T009: src/widgets/navbar-rodape/ui/MenuAcoes.tsx

# Só após ambas:
T010: integração em NavbarRodape.tsx
```

---

## Implementation Strategy

### MVP (User Story 1 apenas)

1. Completar Phase 1: Setup
2. Completar Phase 2: Fundacional (crítico)
3. Completar Phase 3: US1 (T005 → T006 → T007)
4. **Parar e validar**: ACs 01–05 do quickstart.md
5. Navbar com navegação e estado ativo já entrega valor independente

### Entrega incremental

1. Setup + Fundacional → estrutura de layout pronta
2. US1 → navbar com navegação funcional → validar ACs 01–05
3. US2 → menu flutuante completo → validar ACs 06–12
4. US3 → safe area + scroll → validar ACs 13–15
5. Polish → lint, build, revisão de tokens

---

## Notas

- `[P]` = arquivos diferentes, sem dependências entre si — podem iniciar em paralelo
- `[Story]` mapeia cada task à user story para rastreabilidade
- Cada user story é independentemente completável e testável
- Commits após cada task ou grupo lógico
- Parar em cada checkpoint para validar a story independentemente
- Evitar: lógica de hide-on-scroll, novas variáveis CSS de cor, overlay no clique externo
