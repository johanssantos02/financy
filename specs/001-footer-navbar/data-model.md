# Data Model: Footer Navigation

**Data**: 2026-09-28

Esta feature não possui entidades persistidas no banco de dados. Este documento descreve o
modelo de estado e os tipos de dados do widget.

---

## Estado interno

### `NavbarRodape`

| Campo | Tipo | Valor inicial | Descrição |
|-------|------|---------------|-----------|
| `menuAberto` | `boolean` | `false` | Controla a visibilidade do menu flutuante. Reiniciado para `false` a cada montagem do componente (troca de página). |

---

## Tipos de configuração

### `ItemNavegacao`

Define cada um dos quatro itens de rota do navbar.

```ts
type ItemNavegacao = {
  rotulo: string;     // Texto acessível (não visível na UI)
  rota: string;       // Rota exata para navegação e matching de estado ativo
  icone: ReactNode;   // Ícone renderizado no slot
};
```

**Instâncias**:

| `rotulo` | `rota` | Matching de ativo |
|----------|--------|-------------------|
| `"Início"` | `"/"` | `pathname === "/"` |
| `"Dívidas"` | `"/dividas"` | `pathname.startsWith("/dividas")` |
| `"Lista de desejos"` | `"/lista-de-desejos"` | `pathname.startsWith("/lista-de-desejos")` |
| `"Configurações"` | `"/configuracoes"` | `pathname.startsWith("/configuracoes")` |

### `ItemAcao`

Define cada uma das quatro opções do menu flutuante.

```ts
type ItemAcao = {
  rotulo: string;   // Texto visível na opção do menu
  rota: string;     // Rota de destino ao selecionar a opção
  icone: ReactNode; // Ícone renderizado à esquerda do texto
};
```

**Instâncias**:

| `rotulo` | `rota` |
|----------|--------|
| `"Nova entrada"` | `"/entradas/nova"` |
| `"Nova despesa"` | `"/despesas/nova"` |
| `"Nova dívida"` | `"/dividas/nova"` |
| `"Novo desejo"` | `"/lista-de-desejos/novo"` |

---

## Tokens visuais utilizados

Todos os tokens abaixo já existem em `app/globals.css`. Nenhum novo token é criado.

| Token Tailwind | Variável CSS | Uso no componente |
|----------------|-------------|-------------------|
| `text-primaria` | `--color-primaria` (#16a34a) | Ícone e indicador do item ativo |
| `text-texto-sec` | `--color-texto-sec` (#78716c) | Ícones dos itens inativos |
| `bg-primaria` | `--color-primaria` (#16a34a) | Fundo do botão de ação central |
| `bg-card` | `--color-card` (#ffffff) | Fundo do navbar e do menu flutuante |
| `border-borda` | `--color-borda` (#e7e5e4) | Borda superior do navbar |
| `shadow-*` | — | Sombra do menu flutuante e do botão central |

---

## Dimensões e geometria

| Elemento | Valor |
|----------|-------|
| Altura do navbar | `64px` |
| Padding inferior do navbar | `env(safe-area-inset-bottom)` |
| Altura reservada ao conteúdo | `calc(64px + env(safe-area-inset-bottom))` |
| Tamanho do botão central | `56 × 56px` (circular) |
| Altura mínima por opção do menu | `48px` |
| Número de slots | `5` (distribuição igual: `grid-cols-5` ou `flex` com `flex-1`) |
