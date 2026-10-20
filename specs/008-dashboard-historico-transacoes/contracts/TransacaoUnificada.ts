/**
 * Contratos de interface da feature Dashboard — Histórico de Transações
 *
 * Este arquivo documenta os tipos públicos expostos pelas camadas
 * entities/gasto e widgets/historico-transacoes para consumo pelas
 * camadas superiores (pages, app).
 *
 * NÃO é código de produção — serve como referência para implementação.
 * Os tipos reais residem em src/entities/gasto/model/tipos.ts
 */

// ---------------------------------------------------------------------------
// Tipos de domínio (src/entities/gasto/model/tipos.ts)
// ---------------------------------------------------------------------------

export type TipoTransacao = "GASTO_DINHEIRO" | "GASTO_CARTAO" | "DESPESA_PAGA";

export type TransacaoUnificada = {
  id: string;
  nome: string;
  /** Decimal serializado como string. Ex: "123.45" */
  valor: string;
  tipo: TipoTransacao;
  /** ISO 8601 UTC. Fonte: created_at (gastos) ou paid_at (pagamentos) */
  criadoEm: string;
  /** true apenas para GASTO_DINHEIRO */
  editavel: boolean;
};

export type FiltrosHistorico = {
  busca: string;
  pagina: number;   // 1-indexed
  limite: number;
};

export type ResultadoHistorico = {
  transacoes: TransacaoUnificada[];
  totalItens: number;
  totalPaginas: number;
  paginaAtual: number;
};

// ---------------------------------------------------------------------------
// Contrato da Server Action: excluirGasto
// (src/features/gastos/api/acoes.ts)
// ---------------------------------------------------------------------------

/**
 * Exclui um gasto de dinheiro pertencente à conta família do usuário autenticado.
 * Revalida /dashboard após exclusão.
 *
 * Erros possíveis:
 * - "NAO_AUTENTICADO": sessão inválida
 * - "NAO_ENCONTRADO": gasto não existe ou não pertence à conta família
 * - "OPERACAO_INVALIDA": tentativa de excluir gasto de cartão por esta action
 */
export type ExcluirGastoInput = { id: string };
export type ExcluirGastoOutput =
  | { sucesso: true; dados: { id: string } }
  | { sucesso: false; erro: { tipo: string; mensagem: string } };

// ---------------------------------------------------------------------------
// Props públicas do widget (src/widgets/historico-transacoes/index.ts)
// ---------------------------------------------------------------------------

/**
 * Props do Server Component ListaHistoricoTransacoes.
 * Recebe filtros já validados (vindos de searchParams do page).
 */
export type ListaHistoricoTransacoesProps = {
  contaFamiliaId: string;
  filtros: FiltrosHistorico;
};

// ---------------------------------------------------------------------------
// Contratos de URL (searchParams da rota /dashboard)
// ---------------------------------------------------------------------------

/**
 * Schema de validação com Zod (ver src/entities/gasto/model/schemas.ts):
 *
 *   busca  → string, default ""
 *   pagina → coerce number int min(1), default 1
 *
 * Exemplo de URL: /dashboard?busca=mercado&pagina=2
 *
 * Rota de edição de gasto: /gastos/[id]/editar
 */
export type SearchParamsDashboard = {
  busca?: string;
  pagina?: string;
};
