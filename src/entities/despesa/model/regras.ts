import {
  competenciaDe,
  diferencaEmDias,
  montarData,
  ultimoDiaDoMes,
} from "@/src/shared/lib/datas";

import {
  DIAS_VENCIMENTO_PROXIMO,
  GRUPOS,
  type DespesaBase,
  type GrupoOcorrencias,
  type GrupoSituacao,
  type OcorrenciaDespesa,
  type PagamentoCompetencia,
  type SituacaoDespesa,
} from "./tipos";

export const normalizarNome = (nome: string): string =>
  nome.trim().toLocaleLowerCase("pt-BR");

type DadosVigencia = Pick<DespesaBase, "vencimento" | "recorrente" | "excluidoEm">;

// Recorrentes repetem o dia do vencimento em todo mês a partir do primeiro; meses mais
// curtos usam o último dia. Após a exclusão, só as competências anteriores continuam
// visíveis, preservando o histórico. Não recorrentes excluídas somem por completo.
export const vencimentoNaCompetencia = (
  despesa: DadosVigencia,
  competencia: string
): string | null => {
  const competenciaInicial = competenciaDe(despesa.vencimento);

  if (!despesa.recorrente) {
    if (despesa.excluidoEm) return null;
    return competenciaInicial === competencia ? despesa.vencimento : null;
  }

  if (competencia < competenciaInicial) return null;
  if (despesa.excluidoEm && competencia >= competenciaDe(despesa.excluidoEm)) return null;

  const dia = Math.min(Number(despesa.vencimento.slice(8, 10)), ultimoDiaDoMes(competencia));
  return montarData(competencia, dia);
};

export const competenciaPermitida = (despesa: DadosVigencia, competencia: string): boolean =>
  vencimentoNaCompetencia(despesa, competencia) !== null;

export const calcularSituacao = (
  vencimento: string,
  pago: boolean,
  hoje: string
): SituacaoDespesa => {
  if (pago) return "PAGA";
  if (vencimento < hoje) return "VENCIDA";
  if (diferencaEmDias(hoje, vencimento) <= DIAS_VENCIMENTO_PROXIMO) return "VENCIMENTO_PROXIMO";
  return "ABERTA";
};

export const grupoDaSituacao = (situacao: SituacaoDespesa): GrupoSituacao => {
  if (situacao === "VENCIDA") return "VENCIDAS";
  if (situacao === "PAGA") return "PAGAS";
  return "ABERTAS";
};

export const calcularOcorrencias = (
  despesas: DespesaBase[],
  pagamentos: PagamentoCompetencia[],
  competencia: string,
  hoje: string
): OcorrenciaDespesa[] => {
  const pagamentoPorDespesa = new Map(pagamentos.map((p) => [p.despesaId, p]));

  return despesas.flatMap((despesa) => {
    const vencimento = vencimentoNaCompetencia(despesa, competencia);
    if (!vencimento) return [];

    const pagamento = pagamentoPorDespesa.get(despesa.id);
    return [
      {
        despesaId: despesa.id,
        nome: despesa.nome,
        valor: despesa.valor,
        competencia,
        vencimento,
        recorrente: despesa.recorrente,
        descricao: despesa.descricao,
        tags: despesa.tags,
        situacao: calcularSituacao(vencimento, Boolean(pagamento), hoje),
        diasParaVencimento: diferencaEmDias(hoje, vencimento),
        pagamento: pagamento ? { pagoEm: pagamento.pagoEm, pagoPor: pagamento.pagoPor } : null,
      },
    ];
  });
};

const compararOcorrencias = (a: OcorrenciaDespesa, b: OcorrenciaDespesa) =>
  a.vencimento.localeCompare(b.vencimento) || a.nome.localeCompare(b.nome, "pt-BR");

export const agruparEOrdenar = (ocorrencias: OcorrenciaDespesa[]): GrupoOcorrencias[] =>
  GRUPOS.map((grupo) => ({
    grupo,
    itens: ocorrencias
      .filter((o) => grupoDaSituacao(o.situacao) === grupo)
      .sort(compararOcorrencias),
  })).filter((g) => g.itens.length > 0);
