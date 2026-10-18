import { z } from "zod";

import { ehCompetenciaValida } from "@/src/shared/lib/datas";

const schemaValor = z
  .string({ error: "Informe o valor." })
  .trim()
  .regex(/^\d{1,10}([.,]\d{1,2})?$/, "Informe um valor válido.")
  .transform((valor) => valor.replace(",", "."))
  .refine((valor) => Number(valor) > 0, "O valor deve ser maior que zero.");

const schemaDescricao = z
  .string()
  .trim()
  .max(500, "A descrição deve ter no máximo 500 caracteres.")
  .transform((valor) => (valor === "" ? null : valor))
  .nullable();

const schemaTipoReceita = z.enum(["SALARIO", "OUTRO"], { error: "Informe o tipo." });

const schemaCompetencia = z
  .string()
  .refine(ehCompetenciaValida, "Informe o mês de recebimento.");

const camposReceita = {
  valor: schemaValor,
  tipo: schemaTipoReceita,
  descricao: schemaDescricao,
  competencia: schemaCompetencia,
};

export const schemaReceita = z
  .object({
    ...camposReceita,
    descricao: camposReceita.descricao.optional().transform((v) => v ?? null),
    competencia: camposReceita.competencia.optional().transform((v) => v ?? null),
  })
  .superRefine((dados, ctx) => {
    if (dados.tipo === "SALARIO" && !dados.competencia) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe o mês de recebimento.",
        path: ["competencia"],
      });
    }
  });

export const schemaEditarReceita = z
  .object({
    id: z.uuid("Receita inválida."),
    ...camposReceita,
    descricao: camposReceita.descricao.optional().transform((v) => v ?? null),
    competencia: camposReceita.competencia.optional().transform((v) => v ?? null),
  })
  .superRefine((dados, ctx) => {
    if (dados.tipo === "SALARIO" && !dados.competencia) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe o mês de recebimento.",
        path: ["competencia"],
      });
    }
  });

export const schemaIdReceita = z.object({ id: z.uuid("Receita inválida.") });

export type EntradaReceita = z.infer<typeof schemaReceita>;
export type EntradaEditarReceita = z.infer<typeof schemaEditarReceita>;
