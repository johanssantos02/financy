import { z } from "zod";

import { ehDataValida } from "@/src/shared/lib/datas";

const schemaValorGasto = z
  .string({ error: "Informe o valor." })
  .trim()
  .regex(/^\d{1,10}([.,]\d{1,2})?$/, "Informe um valor válido.")
  .transform((valor) => valor.replace(",", "."))
  .refine((valor) => Number(valor) > 0, "O valor deve ser maior que zero.");

export const schemaGasto = z
  .object({
    nome: z
      .string({ error: "Informe o nome." })
      .trim()
      .min(3, "O nome deve ter pelo menos 3 caracteres.")
      .max(80, "O nome deve ter no máximo 80 caracteres."),
    valor: schemaValorGasto,
    formaPagamento: z.enum(["DINHEIRO", "CARTAO"], {
      error: "Selecione a forma de pagamento.",
    }),
    data: z
      .string({ error: "Informe a data." })
      .trim()
      .refine(ehDataValida, "Informe uma data válida."),
    cartaoId: z.uuid("Cartão inválido.").nullish().transform((v) => v ?? null),
    tagId: z.uuid("Tag inválida.").nullish().transform((v) => v ?? null),
  })
  .refine(
    (dados) => dados.formaPagamento !== "CARTAO" || dados.cartaoId !== null,
    { message: "Selecione um cartão.", path: ["cartaoId"] }
  );

export type EntradaGasto = z.infer<typeof schemaGasto>;

export const schemaFiltrosHistorico = z.object({
  busca: z.string().default(""),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
});
