# Contratos de Interface: Tags em Gastos

**Feature**: 009-tags-gastos | **Data**: 2026-10-19

## Server Actions

### `buscarTagsGasto(): Promise<Resultado<ResumoTag[]>>`

Retorna as tags do tipo `GASTOS` disponíveis para a conta família da sessão ativa.

**Arquivo**: `src/features/gastos/api/acoes.ts`

**Entrada**: nenhuma (usa sessão)

**Saída**:
```typescript
// sucesso
{ sucesso: true; dados: Array<{ id: string; nome: string }> }

// falha (sessão inválida)
{ sucesso: false; erro: { tipo: "NAO_AUTENTICADO"; mensagem: string } }
```

**Ordenação**: por `nome` ASC

---

### `criarGasto(entrada: FormData): Promise<Resultado<{ id: string }>>`

**Assinatura já existente** — novos campos no `FormData`:

| Campo | Tipo | Obrigatório | Validação |
|---|---|---|---|
| `tagId` | string (uuid) ou ausente | Não | Se presente: deve ser uuid válido |

**Validação server-side adicional** (pós-Zod):
- Se `tagId` presente: buscar `Tag` WHERE `id = tagId AND contaFamiliaId = <sessão> AND tipo = 'GASTOS'`
- Se não encontrada: retornar `falha("VALIDACAO", "Tag inválida.", { tagId: ["Tag não encontrada ou inválida."] })`

**Novo campo no payload de criação Prisma**:
```typescript
data: {
  ...dadosExistentes,
  tagId: dados.tagId ?? null,
}
```

---

### `editarGasto(entrada: FormData): Promise<Resultado<{ id: string }>>`

**Novo** (substituindo a tela placeholder atual). Campos:

| Campo | Tipo | Obrigatório | Validação |
|---|---|---|---|
| `id` | string (uuid) | Sim | Deve existir na contaFamília da sessão |
| `nome` | string | Sim | 3–80 chars |
| `valor` | string (decimal) | Sim | > 0 |
| `data` | string (YYYY-MM-DD) | Sim | Data válida |
| `formaPagamento` | "DINHEIRO" \| "CARTAO" | Sim | enum |
| `cartaoId` | string (uuid) \| null | Cond. | Obrigatório se CARTAO |
| `tagId` | string (uuid) \| null | Não | Se presente: mesma validação de tipo GASTOS |

**Revalidação**: `revalidatePath("/dashboard")` + `revalidatePath("/despesas")`

---

## Seletor de Tag (componente)

### `SeletorTag`

**Arquivo**: `src/features/gastos/ui/SeletorTag.tsx`

**Props**:
```typescript
type Props = {
  tags: ResumoTag[];          // lista pré-carregada pelo pai
  valorInicial?: string | null;
  comErro?: boolean;
  idAcessibilidade?: string;
  descricaoAcessibilidade?: string;
};
```

**Comportamento**:
- Renderiza `<select name="tagId">` com opção vazia `value=""` (sem tag)
- Itens: cada `ResumoTag` como `<option value={id}>{nome}</option>`
- Se `tags.length === 0`: renderiza `<p>` informativo em vez do select
- Campo não-obrigatório: não valida no front-end se vazio
- Limpeza de erro ao alterar seleção

**HTML semântico**:
```html
<label for="gasto-tagId">Categoria</label>
<select id="gasto-tagId" name="tagId" aria-describedby="gasto-tagId-erro?">
  <option value="">Sem categoria</option>
  <option value="<uuid>">Lazer</option>
  ...
</select>
<p id="gasto-tagId-erro" role="alert">{erro}</p>
```

---

## Exibição de Tag

### Badge de Tag

Componente inline (sem arquivo separado) usado em `ListaDespesas`, `HistoricoTransacoes` e
tela de edição:

```tsx
// Apenas quando tagNome !== null
<span className="text-xs font-medium text-texto-sec bg-fundo-sec px-2 py-0.5 rounded-full">
  {tagNome}
</span>
```

Gastos sem tag não exibem espaço reservado (FR-007: "nenhum rótulo").

---

## Tipos exportados pela entity `tag`

**Arquivo**: `src/entities/tag/index.ts`

```typescript
export type { ResumoTag } from "./model/tipos";
export { listarTagsPorTipo } from "./server";
```

**Arquivo**: `src/entities/tag/server.ts`

```typescript
export { listarTagsPorTipo } from "./api/consultas";
```
