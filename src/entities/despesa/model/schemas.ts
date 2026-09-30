import { z } from "zod";

import {
  competenciaAtual,
  ehCompetenciaValida,
  ehDataValida,
  hojeEmSaoPaulo,
} from "@/src/shared/lib/datas";

import { normalizarNome } from "./regras";
import type { SituacaoDespesa } from "./tipos";

const schemaData = (mensagem: string) =>
  z.string({ error: mensagem }).trim().refine(ehDataValida, mensagem);

const schemaValor = z
  .string({ error: "Informe o valor." })
  .trim()
  .regex(/^\d{1,10}([.,]\d{1,2})?$/, "Informe um valor válido.")
  .transform((valor) => valor.replace(",", "."))
  .refine((valor) => Number(valor) > 0, "O valor deve ser maior que zero.");

const schemaRecorrente = z.preprocess(
  (valor) => valor === true || valor === "true" || valor === "on",
  z.boolean()
);

const schemaDescricao = z
  .string()
  .trim()
  .max(500, "A descrição deve ter no máximo 500 caracteres.")
  .transform((valor) => (valor === "" ? null : valor))
  .nullable();

const schemaTags = z
  .array(
    z
      .string()
      .trim()
      .min(1, "Tags não podem ser vazias.")
      .max(30, "Cada tag deve ter no máximo 30 caracteres.")
  )
  .max(10, "Informe no máximo 10 tags.")
  .transform((tags) => [...new Map(tags.map((tag) => [normalizarNome(tag), tag])).values()]);

const camposDespesa = {
  nome: z
    .string({ error: "Informe o nome." })
    .trim()
    .min(1, "Informe o nome.")
    .max(80, "O nome deve ter no máximo 80 caracteres."),
  valor: schemaValor,
  vencimento: schemaData("Informe o vencimento."),
  lancamento: schemaData("Informe uma data de lançamento válida."),
  recorrente: schemaRecorrente,
  descricao: schemaDescricao,
  tags: schemaTags,
};

export const schemaDespesa = z.object({
  ...camposDespesa,
  lancamento: camposDespesa.lancamento.optional().transform((v) => v ?? hojeEmSaoPaulo()),
  recorrente: camposDespesa.recorrente.default(false),
  descricao: camposDespesa.descricao.optional().transform((v) => v ?? null),
  tags: camposDespesa.tags.default([]),
});

export const schemaEditarDespesa = z.object({
  id: z.uuid("Despesa inválida."),
  nome: camposDespesa.nome.optional(),
  valor: camposDespesa.valor.optional(),
  vencimento: camposDespesa.vencimento.optional(),
  lancamento: camposDespesa.lancamento.optional(),
  recorrente: camposDespesa.recorrente.optional(),
  descricao: camposDespesa.descricao.optional(),
  tags: camposDespesa.tags.optional(),
});

export const schemaIdDespesa = z.object({ id: z.uuid("Despesa inválida.") });

export const schemaPagamento = z.object({
  id: z.uuid("Despesa inválida."),
  competencia: z.string().refine(ehCompetenciaValida, "Informe o mês no formato AAAA-MM."),
});

export type EntradaDespesa = z.infer<typeof schemaDespesa>;
export type EntradaEditarDespesa = z.infer<typeof schemaEditarDespesa>;

// Filtros da listagem — vêm da URL, então valores inválidos são descartados em vez de rejeitados.

export type FiltrosDespesa = {
  q: string | null;
  competencia: string;
  situacoes: SituacaoDespesa[];
  tags: string[];
  recorrente: boolean | null;
};

type ParametrosBusca = Record<string, string | string[] | undefined>;

const situacaoPorParametro: Record<string, SituacaoDespesa> = {
  aberta: "ABERTA",
  "vencimento-proximo": "VENCIMENTO_PROXIMO",
  vencida: "VENCIDA",
  paga: "PAGA",
};

export const parametroPorSituacao = Object.fromEntries(
  Object.entries(situacaoPorParametro).map(([parametro, situacao]) => [situacao, parametro])
) as Record<SituacaoDespesa, string>;

const comoLista = (valor: string | string[] | undefined): string[] =>
  valor === undefined ? [] : Array.isArray(valor) ? valor : [valor];

const primeiro = (valor: string | string[] | undefined): string | undefined =>
  comoLista(valor)[0];

export const normalizarFiltros = (parametros: ParametrosBusca): FiltrosDespesa => {
  const q = (primeiro(parametros.q) ?? "").trim().slice(0, 100);
  const mes = primeiro(parametros.mes) ?? "";
  const situacoes = [
    ...new Set(
      comoLista(parametros.situacao).flatMap((valor) => {
        const situacao = situacaoPorParametro[valor];
        return situacao ? [situacao] : [];
      })
    ),
  ];
  const tags = [
    ...new Set(
      comoLista(parametros.tag)
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0 && tag.length <= 30)
    ),
  ].slice(0, 10);
  const recorrente = primeiro(parametros.recorrente);

  return {
    q: q === "" ? null : q,
    competencia: ehCompetenciaValida(mes) ? mes : competenciaAtual(),
    situacoes,
    tags,
    recorrente: recorrente === "sim" ? true : recorrente === "nao" ? false : null,
  };
};

export const contarFiltros = (filtros: FiltrosDespesa): number =>
  [
    filtros.competencia !== competenciaAtual(),
    filtros.situacoes.length > 0,
    filtros.tags.length > 0,
    filtros.recorrente !== null,
  ].filter(Boolean).length;

export const paraSearchParams = (
  filtros: FiltrosDespesa,
  { semFiltros = false }: { semFiltros?: boolean } = {}
): string => {
  const parametros = new URLSearchParams();
  if (filtros.q) parametros.set("q", filtros.q);
  if (!semFiltros) {
    if (filtros.competencia !== competenciaAtual()) parametros.set("mes", filtros.competencia);
    filtros.situacoes.forEach((s) => parametros.append("situacao", parametroPorSituacao[s]));
    filtros.tags.forEach((tag) => parametros.append("tag", tag));
    if (filtros.recorrente !== null) {
      parametros.set("recorrente", filtros.recorrente ? "sim" : "nao");
    }
  }
  const texto = parametros.toString();
  return texto ? `?${texto}` : "";
};
