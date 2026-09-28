# Research: Footer Navigation

**Data**: 2026-09-28

## 1. safe-area-inset-bottom com Tailwind CSS v4

**Decision**: usar `env(safe-area-inset-bottom)` via valor arbitrário do Tailwind e adicionar
`viewport-fit=cover` ao metadata do layout raiz.

**Rationale**: `env(safe-area-inset-bottom)` é a função CSS padrão para ler a área segura inferior
em iOS Safari e Android Chrome. Sem `viewport-fit=cover` no viewport meta, a variável retorna `0`
em iOS — a página fica cercada pelo safe area em vez de poder estender até a borda.

**Como aplicar**:
- No `app/layout.tsx`, adicionar ao objeto `metadata`:
  ```ts
  viewport: { width: 'device-width', initialScale: 1, viewportFit: 'cover' }
  ```
- No navbar: `style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}` para que o fundo
  do navbar se estenda até a borda do dispositivo.
- Na altura reservada ao conteúdo: `calc(64px + env(safe-area-inset-bottom))`.
- Tailwind v4 suporta valores arbitrários com `env()`: classe `pb-[env(safe-area-inset-bottom)]`
  é válida.

**Alternatives considered**:
- `@supports (padding: env(safe-area-inset-bottom))` — desnecessário; suporte é universal em
  dispositivos modernos iOS/Android.
- `constant(safe-area-inset-bottom)` (iOS ≤ 11) — ignorado; fora do suporte mínimo razoável.

---

## 2. Detectar clique fora do menu sem overlay

**Decision**: `useEffect` com `document.addEventListener('pointerdown', handler)` + dois refs
(`menuRef`, `botaoRef`). Verificar se `event.target` está contido em algum dos dois antes de
fechar.

**Rationale**: A spec proíbe overlay sobre o conteúdo. O padrão de `ref + document listener` é
a alternativa canônica — não bloqueia interação com o restante da página e funciona em touch
(pointerdown cobre mouse e touch). Limpar o listener em cleanup evita vazamento de memória.

```ts
useEffect(() => {
  if (!menuAberto) return;
  const handler = (e: PointerEvent) => {
    if (
      menuRef.current?.contains(e.target as Node) ||
      botaoRef.current?.contains(e.target as Node)
    ) return;
    setMenuAberto(false);
  };
  document.addEventListener('pointerdown', handler);
  return () => document.removeEventListener('pointerdown', handler);
}, [menuAberto]);
```

**Alternatives considered**:
- `onBlur` no container — não funciona para cliques fora de elementos focáveis.
- Overlay transparente — explicitamente proibido pela spec.
- `document.addEventListener('click', ...)` — funciona, mas `pointerdown` é mais responsivo em
  touch e evita o delay de 300ms em navegadores mais antigos.

---

## 3. usePathname com grupos de rotas

**Decision**: `usePathname()` do `next/navigation` retorna o pathname sem o prefixo do grupo de
rotas.

**Rationale**: Grupos de rotas como `(app)` são organizacionais — não aparecem na URL. Assim,
`usePathname()` em uma página `app/(app)/dashboard/page.tsx` retorna `/dashboard`, não
`/(app)/dashboard`.

**Regras de matching para estado ativo**:
- Início (`/`): comparação exata `pathname === '/'`
- Demais rotas: `pathname.startsWith('/dividas')`, `pathname.startsWith('/lista-de-desejos')`,
  `pathname.startsWith('/configuracoes')`
- O `startsWith` garante que subrotas (ex: `/dividas/nova`) também ativam o item correto.
- Páginas de criação (`/entradas/nova`, etc.) não correspondem a nenhuma rota de navegação →
  nenhum item ativo, conforme esperado.

**Alternatives considered**:
- Comparação exata para todas as rotas — quebraria o estado ativo em subrotas futuras.
- `useSelectedLayoutSegment` — mais complexo e necessário apenas para layouts aninhados.

---

## 4. Biblioteca de ícones

**Decision**: adicionar `lucide-react` como dependência.

**Rationale**: `lucide-react` é tree-shakeable, compatível com React 19 e é a biblioteca de
ícones de fato padrão no ecossistema Next.js/Tailwind. Os ícones são importados individualmente,
sem impacto no bundle de páginas que não usam o componente.

**Ícones sugeridos** (decisão final pertence à implementação):
| Item | Ícone lucide-react |
|------|--------------------|
| Início | `House` |
| Dívidas | `CreditCard` |
| Botão + / × | `Plus` / `X` |
| Lista de desejos | `Heart` |
| Configurações | `Settings` |
| Nova entrada | `TrendingUp` |
| Nova despesa | `TrendingDown` |
| Nova dívida | `CreditCard` |
| Novo desejo | `Heart` |

**Alternatives considered**:
- SVG inline — sem dependência, mas aumenta o bundle e reduz manutenibilidade.
- `heroicons/react` — boa alternativa, menos usada com Tailwind v4.
- `@phosphor-icons/react` — maior variedade, mas menos padronizado no ecossistema.

---

## 5. Estrutura interna do widget

**Decision**: três componentes no segmento `ui/` do widget, orquestrados pelo `NavbarRodape`.

**Rationale**: separar `BotaoAcao` e `MenuAcoes` do componente principal facilita o teste
unitário de cada parte, mas toda a lógica de estado (`menuAberto`) fica em `NavbarRodape`
para evitar prop-drilling desnecessário via contexto. `BotaoAcao` recebe `aberto` e `onToggle`;
`MenuAcoes` recebe `aberto` e `onFechar`.

**Alternatives considered**:
- Tudo em um único arquivo — aceitável para esta feature, mas prejudica legibilidade com >150 LOC.
- Context API para o estado do menu — desnecessário; o estado não precisa ser compartilhado além
  dos filhos diretos do `NavbarRodape`.
