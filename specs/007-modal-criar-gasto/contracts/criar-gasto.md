# Contrato: Server Action `criarGasto`

## Localização

`src/features/gastos/api/acoes.ts` — `"use server"`

## Assinatura

```typescript
export async function criarGasto(
  entrada: EntradaFormulario
): Promise<Resultado<{ id: string }>>
```

`EntradaFormulario = FormData | Record<string, unknown>`
`Resultado<T>` — tipo discriminado do projeto (`sucesso/falha`) em `src/shared/lib/resultado`

---

## Schema de entrada (Zod)

```typescript
export const schemaGasto = z.object({
  nome: z
    .string({ error: "Informe o nome." })
    .trim()
    .min(3, "O nome deve ter pelo menos 3 caracteres.")
    .max(80, "O nome deve ter no máximo 80 caracteres."),

  valor: z
    .string({ error: "Informe o valor." })
    .trim()
    .regex(/^\d{1,10}([.,]\d{1,2})?$/, "Informe um valor válido.")
    .transform((v) => v.replace(",", "."))
    .refine((v) => Number(v) > 0, "O valor deve ser maior que zero."),

  formaPagamento: z.enum(["DINHEIRO", "CARTAO"], {
    error: "Selecione a forma de pagamento.",
  }),

  cartaoId: z.string().uuid("Cartão inválido.").nullable().optional(),

  data: z
    .string({ error: "Informe a data." })
    .trim()
    .refine(ehDataValida, "Data inválida."),
}).superRefine((dados, ctx) => {
  if (dados.formaPagamento === "CARTAO" && !dados.cartaoId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Selecione um cartão.",
      path: ["cartaoId"],
    });
  }
  if (dados.formaPagamento === "DINHEIRO" && dados.cartaoId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cartão não deve ser informado para pagamento em dinheiro.",
      path: ["cartaoId"],
    });
  }
});

export type EntradaGasto = z.infer<typeof schemaGasto>;
```

---

## Fluxo de execução

```
criarGasto(entrada)
  1. obterContextoUsuario()          → usuarioId, contaFamiliaId
     Falha: retornar NAO_AUTENTICADO / SEM_PERMISSAO

  2. schemaGasto.safeParse(lerFormData(entrada))
     Falha: retornar VALIDACAO com campos

  3a. Se formaPagamento === DINHEIRO:
        clientePrisma.gasto.create({ ... })
        revalidatePath("/despesas")
        retornar sucesso({ id })

  3b. Se formaPagamento === CARTAO:
        clientePrisma.$transaction(async (tx) => {
          // Bloqueio pessimista
          const [cartao] = await tx.$queryRaw`
            SELECT limite, used_limit AS "limiteUsado"
            FROM credit_cards
            WHERE id = ${cartaoId}::uuid
              AND family_account_id = ${contaFamiliaId}::uuid
            FOR UPDATE
          `
          if (!cartao) throw new Error("CARTAO_NAO_ENCONTRADO")

          const limiteDisponivel = Number(cartao.limite) - Number(cartao.limiteUsado)
          if (Number(dados.valor) > limiteDisponivel) throw new Error("LIMITE_EXCEDIDO")

          const criado = await tx.gasto.create({ ... })

          await tx.cartaoCredito.update({
            where: { id: cartaoId },
            data: { limiteUsado: { increment: new Decimal(dados.valor) } },
          })

          return criado
        })
        revalidatePath("/despesas")
        retornar sucesso({ id })
```

---

## Códigos de retorno

| Tipo de falha | `tipo` no `Resultado` | Mensagem exibida |
|---|---|---|
| Não autenticado | `NAO_AUTENTICADO` | "Faça login para continuar." |
| Sem conta família | `SEM_PERMISSAO` | "Você não participa de uma conta família." |
| Validação de campos | `VALIDACAO` | Campo-a-campo (ver schema) |
| Cartão não encontrado | `NAO_ENCONTRADO` | "Cartão não encontrado." |
| Limite excedido | `REGRA_DE_NEGOCIO` | "Limite disponível insuficiente. Disponível: R$ X,XX." |
| Erro inesperado | `ERRO_INTERNO` | "Ocorreu um erro. Tente novamente." |

---

## Campos injetados pelo servidor (nunca do cliente)

| Campo | Origem |
|---|---|
| `usuarioId` | `sessao.user.id` via `obterContextoUsuario()` |
| `contaFamiliaId` | Primeiro vínculo do usuário em `ContaFamiliaMembro` |

---

## Contrato auxiliar: `listarCartoesParaGasto`

Server function em `src/entities/cartao/server.ts`:

```typescript
// Retorna apenas id, nome, instituicao e limiteDisponivel
export async function listarCartoesParaGasto(
  contaFamiliaId: string
): Promise<CartaoParaGasto[]>

export type CartaoParaGasto = {
  id: string;
  nome: string;
  instituicao: string;
  limiteDisponivel: string; // (limite - limiteUsado).toFixed(2)
}
```

Usada pelo Server Component pai do modal para passar a lista de cartões como prop.
