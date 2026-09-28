# Contract: Widget NavbarRodape

**Data**: 2026-09-28

## API pública do widget

Exportado de `src/widgets/navbar-rodape/index.ts`.

### Componente `NavbarRodape`

```ts
// Assinatura de uso
import { NavbarRodape } from '@/src/widgets/navbar-rodape';

// Sem props obrigatórias ou opcionais.
// O componente é totalmente autônomo.
<NavbarRodape />
```

**Invariantes**:
- Sempre renderiza cinco slots na ordem: Início, Dívidas, Adicionar, Lista de desejos, Configurações.
- O estado do menu sempre inicia fechado na montagem.
- Nunca aceita `userId` ou dados de sessão — não acessa dados do usuário.
- Não recebe callbacks externos — todas as interações são internamente gerenciadas.

---

## Contrato de integração: `app/(app)/layout.tsx`

O layout do grupo autenticado DEVE:

1. Renderizar `<NavbarRodape />` como elemento irmão do `{children}`, abaixo dele no DOM.
2. Envolver `{children}` em um container que possua padding inferior igual a
   `calc(64px + env(safe-area-inset-bottom))` para que o conteúdo nunca fique oculto atrás
   do navbar.
3. Manter o layout como Server Component (não adicionar `"use client"`).

**Estrutura mínima esperada**:

```tsx
// app/(app)/layout.tsx
export default function AppLayout({ children }) {
  return (
    <div className="flex flex-col min-h-full">
      <main className="flex-1 pb-[calc(64px+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <NavbarRodape />
    </div>
  );
}
```

---

## Contrato de comportamento: Menu flutuante

O menu flutuante DEVE ser fechado nas seguintes situações:

| Gatilho | Navegação ocorre? |
|---------|-------------------|
| Toque no botão × | Não |
| Toque fora do menu e fora do botão | Não |
| Seleção de uma opção do menu | Sim (rota do item) |
| Toque em item de navegação do navbar | Sim (rota do item) |
| Montagem do componente (nova página) | — (inicia fechado) |

---

## Contrato de estado ativo

| Rota atual | Item ativo |
|------------|-----------|
| `/` | Início |
| `/dividas` | Dívidas |
| `/dividas/nova` | Dívidas |
| `/lista-de-desejos` | Lista de desejos |
| `/lista-de-desejos/novo` | Lista de desejos |
| `/configuracoes` | Configurações |
| `/entradas/nova` | Nenhum |
| `/despesas/nova` | Nenhum |
| qualquer outra rota | Nenhum |

O botão central (Adicionar) nunca possui estado ativo.

---

## Contrato de viewport

O navbar DEVE:
- `position: fixed; bottom: 0; left: 0; right: 0` — fixo na parte inferior
- `width: 100vw` ou `width: 100%` sem `max-width`
- `z-index` suficiente para ficar acima do conteúdo da página
- Não gerar `overflow-x` na viewport
