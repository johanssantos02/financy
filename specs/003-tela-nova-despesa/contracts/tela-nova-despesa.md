# Contrato: Tela de nova despesa

## Rota

`GET /despesas/nova?origem=<caminho interno opcional>`

- Protegida pelo layout `app/(app)` (usuário autenticado).
- `origem`: validado com Zod na página. Aceito somente se começar com `/`, não começar com `//` e não
  começar com `/despesas/nova`. Inválido ou ausente → tratado como ausente.
- Metadata: `title: "Nova despesa | Financy"`.

## Entrada (navegação)

`MenuAcoes` → opção "Nova despesa":
`router.push("/despesas/nova?origem=" + encodeURIComponent(location.pathname + location.search))`.

## Estrutura da tela

```text
<main>
  <h1>Nova despesa</h1>
  <p>Descrição: cadastre uma conta a pagar da sua família…</p>
  <p>Aviso: "Campos marcados com * são obrigatórios."</p>
  <form noValidate>
    Nome *            input text, maxLength 80, autoComplete off
    Descrição         textarea, maxLength 500
    Vencimento *      input date
    Valor *           input text, inputMode decimal, placeholder "0,00"
    [ ] Despesa recorrente   checkbox
    [Cancelar] (type=button)   [Salvar] (type=submit, disabled + "Salvando…" enquanto pendente)
  </form>
</main>
```

Cada campo: `<label htmlFor>` visível; em erro → `aria-invalid="true"`,
`aria-describedby="<campo>-erro"`, borda `--perigo`, `<p id="<campo>-erro">` com a mensagem.

## Props

```ts
// pages/nova-despesa
PaginaNovaDespesa({ origem }: { origem: string | null })

// features/despesas (Client Component)
FormularioNovaDespesa({ origem }: { origem: string | null })
```

## Ação chamada

`criarDespesa(formData: FormData): Promise<Resultado<{ id: string }>>` — contrato existente em
`specs/002-crud-despesas/contracts/acoes-despesa.md`.

| Resultado | Comportamento da tela |
| --- | --- |
| `sucesso` | toast "Despesa cadastrada."; voltar (regra abaixo) |
| `VALIDACAO` com `campos` | toast com `erro.mensagem`; destacar campos; foco no primeiro |
| `CONFLITO` | toast "Já existe uma despesa com este nome."; destacar e focar `nome` |
| `NAO_AUTENTICADO` / `SEM_PERMISSAO` / `ERRO_INTERNO` | toast com `erro.mensagem`; valores preservados |

## Regra de retorno (cancelar e sucesso)

```text
se origem válida e window.history.length > 1 → router.back()
senão                                        → router.replace(origem ?? "/despesas")
```

## Ordem de foco em erro

`nome → descricao → vencimento → valor`
