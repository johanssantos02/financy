export type FormaPagamento = "DINHEIRO" | "CARTAO";

export type ResumoGasto = {
  id: string;
  nome: string;
  valor: string;
  formaPagamento: FormaPagamento;
  data: string;
  cartaoId: string | null;
  cartaoNome: string | null;
  tagId: string | null;
  tagNome: string | null;
};

export type TipoTransacao = "GASTO_DINHEIRO" | "GASTO_CARTAO" | "DESPESA_PAGA";

export type TransacaoUnificada = {
  id: string;
  nome: string;
  valor: string;
  tipo: TipoTransacao;
  criadoEm: string;
  editavel: boolean;
  tagNome: string | null;
};

export type FiltrosHistorico = {
  busca: string;
  pagina: number;
  limite: number;
};

export type ResultadoHistorico = {
  transacoes: TransacaoUnificada[];
  totalItens: number;
  totalPaginas: number;
  paginaAtual: number;
};
