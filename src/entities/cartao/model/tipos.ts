// Resumo exibido na listagem de cartões.
// limiteUsado é sempre "0.00" nesta entrega — será calculado quando existir vínculo com compras.
export type ResumoCartao = {
  id: string;
  nome: string;
  instituicao: string;
  limite: string;
  limiteUsado: string;
  diaFechamento: number;
  diaVencimento: number;
  cor: string | null;
};

// Detalhe carregado no formulário de edição.
export type DetalheCartao = {
  id: string;
  nome: string;
  instituicao: string;
  limite: string;
  diaFechamento: number;
  diaVencimento: number;
  cor: string | null;
};
