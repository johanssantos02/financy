import { z } from "zod";

const schemaNome = z
  .string({ error: "Informe o nome do cartão." })
  .trim()
  .min(1, "Informe o nome do cartão.")
  .max(60, "O nome deve ter no máximo 60 caracteres.");

const schemaInstituicao = z
  .string({ error: "Informe a instituição financeira." })
  .trim()
  .min(1, "Informe a instituição financeira.")
  .max(60, "A instituição deve ter no máximo 60 caracteres.");

const schemaLimite = z
  .string({ error: "Informe o limite." })
  .trim()
  .min(1, "Informe o limite.")
  .regex(/^\d{1,10}([.,]\d{1,2})?$/, "Informe um limite válido.")
  .transform((valor) => valor.replace(",", "."))
  .refine((valor) => Number(valor) > 0, "O limite deve ser maior que zero.");

const schemaDia = (campo: "fechamento" | "vencimento") => {
  const mensagem =
    campo === "fechamento"
      ? "Informe um dia de fechamento entre 1 e 31."
      : "Informe um dia de vencimento entre 1 e 31.";

  return z.preprocess(
    (valor) => (typeof valor === "string" ? Number(valor) : valor),
    z
      .number({ error: mensagem })
      .int(mensagem)
      .min(1, mensagem)
      .max(31, mensagem)
  );
};

const schemaCor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida.")
  .optional();

export const schemaCartao = z.object({
  nome: schemaNome,
  instituicao: schemaInstituicao,
  limite: schemaLimite,
  diaFechamento: schemaDia("fechamento"),
  diaVencimento: schemaDia("vencimento"),
  cor: schemaCor,
});

export const schemaEditarCartao = schemaCartao.extend({
  id: z.string().uuid("Cartão inválido."),
});

export const schemaIdCartao = z.object({
  id: z.string().uuid("Cartão inválido."),
});

export type EntradaCartao = z.infer<typeof schemaCartao>;
export type EntradaEditarCartao = z.infer<typeof schemaEditarCartao>;
