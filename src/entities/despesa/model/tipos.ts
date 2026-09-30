export const SITUACOES = ["ABERTA", "VENCIMENTO_PROXIMO", "VENCIDA", "PAGA"] as const;
export type SituacaoDespesa = (typeof SITUACOES)[number];

export const GRUPOS = ["VENCIDAS", "ABERTAS", "PAGAS"] as const;
export type GrupoSituacao = (typeof GRUPOS)[number];

export const DIAS_VENCIMENTO_PROXIMO = 5;

export type DespesaBase = {
  id: string;
  nome: string;
  valor: string;
  vencimento: string;
  recorrente: boolean;
  descricao: string | null;
  tags: string[];
  excluidoEm: string | null;
};

export type PagamentoCompetencia = {
  despesaId: string;
  pagoEm: string;
  pagoPor: string;
};

export type OcorrenciaDespesa = {
  despesaId: string;
  nome: string;
  valor: string;
  competencia: string;
  vencimento: string;
  recorrente: boolean;
  descricao: string | null;
  tags: string[];
  situacao: SituacaoDespesa;
  diasParaVencimento: number;
  pagamento: { pagoEm: string; pagoPor: string } | null;
};

export type GrupoOcorrencias = {
  grupo: GrupoSituacao;
  itens: OcorrenciaDespesa[];
};

export type ListagemDespesas = {
  competencia: string;
  grupos: GrupoOcorrencias[];
  totalFiltrosAplicados: number;
};

export type DetalheDespesa = {
  id: string;
  nome: string;
  valor: string;
  vencimento: string;
  lancamento: string;
  recorrente: boolean;
  descricao: string | null;
  tags: string[];
};
