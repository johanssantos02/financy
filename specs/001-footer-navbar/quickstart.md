# Quickstart: Validação do Footer Navigation

**Data**: 2026-09-28

## Pré-requisitos

- Dependências instaladas: `npm install`
- `lucide-react` instalado: `npm install lucide-react`
- Servidor de desenvolvimento rodando: `npm run dev`
- Abrir no navegador com DevTools → emulação de dispositivo mobile (ex: iPhone 14)

## Build e lint

```bash
npm run lint
npm run build
```

Ambos devem passar sem erros antes de considerar a feature completa.

---

## Cenários de validação manual

### AC-01 — Estrutura do navbar

1. Abrir qualquer página autenticada.
2. Inspecionar o DOM do navbar.
3. **Esperado**: cinco elementos filhos na ordem Início, Dívidas, botão central, Lista de desejos,
   Configurações.

### AC-02 — Largura total sem overflow

1. Em emulação mobile, abrir qualquer página.
2. Verificar que não existe barra de rolagem horizontal.
3. Inspecionar o navbar e confirmar `width: 100%` sem `max-width`.

### AC-03 — Estado ativo por rota

Navegar para cada rota e confirmar o item ativo correspondente:

| URL | Item esperado como ativo |
|-----|--------------------------|
| `/` | Início |
| `/dividas` | Dívidas |
| `/lista-de-desejos` | Lista de desejos |
| `/configuracoes` | Configurações |
| `/entradas/nova` | Nenhum |

O item ativo deve apresentar a cor `--color-primaria` (#16a34a). Os demais devem apresentar
`--color-texto-sec` (#78716c).

### AC-04 e AC-05 — Navegação e item já ativo

1. Estando em `/`, tocar em "Dívidas" → deve navegar para `/dividas`.
2. Estando em `/dividas`, tocar em "Dívidas" novamente → nenhuma navegação deve ocorrer.

### AC-06 e AC-07 — Abrir e fechar menu pelo botão

1. Tocar no botão + → menu flutuante deve aparecer acima do navbar; botão deve mudar para ×.
2. Tocar no botão × → menu deve desaparecer; botão deve retornar para +.

### AC-08 — Fechar pelo clique fora

1. Abrir o menu (+).
2. Tocar em qualquer área da página fora do menu e fora do botão central.
3. **Esperado**: menu fecha. Nenhum overlay visível.

### AC-09 a AC-12 — Seleção de ação

1. Abrir o menu.
2. Tocar em "Nova entrada" → menu fecha; navega para `/entradas/nova`.
3. Repetir para "Nova despesa" (`/despesas/nova`), "Nova dívida" (`/dividas/nova`),
   "Novo desejo" (`/lista-de-desejos/novo`).

### AC-13 — Navbar fixo durante scroll

1. Abrir uma página com conteúdo longo suficiente para rolar.
2. Rolar para baixo e para cima.
3. **Esperado**: navbar permanece fixo na parte inferior em todo momento.
4. **Não esperado**: navbar some ao rolar para baixo e reaparece ao rolar para cima.

### AC-14 — Safe area

1. Usar o DevTools do Safari ou um dispositivo iOS real (iPhone com notch ou Dynamic Island).
2. Abrir qualquer página.
3. **Esperado**: os ícones do navbar não ficam sobrepostos pela área de gesto inferior.
4. Verificar que `viewport-fit=cover` está presente no `<meta name="viewport">`.

### AC-15 — Navbar nas páginas de criação

1. Navegar para `/entradas/nova` (ou qualquer outra rota de criação).
2. **Esperado**: navbar continua visível na parte inferior.
3. Nenhum item de navegação deve estar ativo.

---

## Verificação de tokens visuais

Abrir o DevTools e confirmar que o componente não introduz nenhuma cor hardcoded. Todos os valores
de cor devem referenciar as variáveis CSS existentes:

```
--color-primaria       → ícone/indicador ativo
--color-texto-sec      → ícones inativos
--color-card           → fundo do navbar e do menu
--color-borda          → borda superior do navbar
```

---

## Artefatos de referência

- Contrato do widget: [contracts/navbar-rodape.md](./contracts/navbar-rodape.md)
- Dimensões e tokens: [data-model.md](./data-model.md)
- Decisões técnicas: [research.md](./research.md)
