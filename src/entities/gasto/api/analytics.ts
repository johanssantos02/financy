import "server-only";

import { clientePrisma } from "@/src/shared/api/prisma";
import type {
  DadosAnalytics,
  DistribuicaoTipo,
  FiltrosAnalytics,
  GastoCategoria,
  KPIAnalytics,
  LimiteOrcamentoDados,
  PontoTendencia,
  TransacaoAnalytics,
} from "../model/tipos";

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

function inicioDoMesAnterior(dataInicio: Date): Date {
  return new Date(Date.UTC(dataInicio.getUTCFullYear(), dataInicio.getUTCMonth() - 1, 1));
}

function fimDoMesAnterior(dataInicio: Date): Date {
  return new Date(Date.UTC(dataInicio.getUTCFullYear(), dataInicio.getUTCMonth(), 1));
}

function buildMembroWhere(
  membro: FiltrosAnalytics["membro"],
  usuarioId: string,
  parceiroId: string | null
): Record<string, string> | Record<string, never> {
  if (membro === "meus") return { criadoPorId: usuarioId };
  if (membro === "parceiro" && parceiroId) return { criadoPorId: parceiroId };
  return {};
}

// ---------------------------------------------------------------------------
// buscarParceiroId
// ---------------------------------------------------------------------------

export async function buscarParceiroId(
  contaFamiliaId: string,
  usuarioId: string
): Promise<string | null> {
  const membro = await clientePrisma.contaFamiliaMembro.findFirst({
    where: { contaFamiliaId, usuarioId: { not: usuarioId } },
    select: { usuarioId: true },
  });
  return membro?.usuarioId ?? null;
}

// ---------------------------------------------------------------------------
// buscarKPIAnalytics
// ---------------------------------------------------------------------------

export async function buscarKPIAnalytics(
  contaFamiliaId: string,
  usuarioId: string,
  parceiroId: string | null,
  filtros: FiltrosAnalytics
): Promise<KPIAnalytics> {
  const membroWhere = buildMembroWhere(filtros.membro, usuarioId, parceiroId);

  // Gastos do período
  const tiposFiltro = filtros.tiposGasto;
  const incluiCartao = tiposFiltro.length === 0 || tiposFiltro.includes("cartao");
  const incluiDinheiro = tiposFiltro.length === 0 || tiposFiltro.includes("dinheiro");
  const incluiEntrada = tiposFiltro.length === 0 || tiposFiltro.includes("entrada");

  const whereGasto = {
    contaFamiliaId,
    data: { gte: filtros.dataInicio, lt: filtros.dataFim },
    ...(filtros.categoriaIds.length > 0 ? { tagId: { in: filtros.categoriaIds } } : {}),
    ...(filtros.cartaoIds.length > 0 ? { cartaoId: { in: filtros.cartaoIds } } : {}),
    ...membroWhere,
  };

  const [agGastoCartao, agGastoDinheiro, agReceita] = await Promise.all([
    incluiCartao
      ? clientePrisma.gasto.aggregate({
          where: { ...whereGasto, formaPagamento: "CARTAO" },
          _sum: { valor: true },
        })
      : Promise.resolve({ _sum: { valor: null } }),
    incluiDinheiro
      ? clientePrisma.gasto.aggregate({
          where: { ...whereGasto, formaPagamento: "DINHEIRO" },
          _sum: { valor: true },
        })
      : Promise.resolve({ _sum: { valor: null } }),
    incluiEntrada && filtros.tiposGasto.length === 0
      ? clientePrisma.receita.aggregate({
          where: {
            contaFamiliaId,
            OR: [
              {
                competencia: {
                  gte: filtros.dataInicio,
                  lt: filtros.dataFim,
                },
              },
              {
                competencia: null,
                criadoEm: { gte: filtros.dataInicio, lt: filtros.dataFim },
              },
            ],
            ...membroWhere,
          },
          _sum: { valor: true },
        })
      : incluiEntrada
        ? clientePrisma.receita.aggregate({
            where: {
              contaFamiliaId,
              OR: [
                { competencia: { gte: filtros.dataInicio, lt: filtros.dataFim } },
                {
                  competencia: null,
                  criadoEm: { gte: filtros.dataInicio, lt: filtros.dataFim },
                },
              ],
              ...membroWhere,
            },
            _sum: { valor: true },
          })
        : Promise.resolve({ _sum: { valor: null } }),
  ]);

  const totalGasto =
    (agGastoCartao._sum.valor?.toNumber() ?? 0) +
    (agGastoDinheiro._sum.valor?.toNumber() ?? 0);
  const totalEntrada = agReceita._sum.valor?.toNumber() ?? 0;
  const saldo = totalEntrada - totalGasto;

  // Mês anterior para comparativo
  const inicioAnterior = inicioDoMesAnterior(filtros.dataInicio);
  const fimAnterior = fimDoMesAnterior(filtros.dataInicio);

  const [agGastoAnteriorCartao, agGastoAnteriorDinheiro] = await Promise.all([
    clientePrisma.gasto.aggregate({
      where: {
        contaFamiliaId,
        formaPagamento: "CARTAO",
        data: { gte: inicioAnterior, lt: fimAnterior },
        ...membroWhere,
      },
      _sum: { valor: true },
    }),
    clientePrisma.gasto.aggregate({
      where: {
        contaFamiliaId,
        formaPagamento: "DINHEIRO",
        data: { gte: inicioAnterior, lt: fimAnterior },
        ...membroWhere,
      },
      _sum: { valor: true },
    }),
  ]);

  const totalGastoAnterior =
    (agGastoAnteriorCartao._sum.valor?.toNumber() ?? 0) +
    (agGastoAnteriorDinheiro._sum.valor?.toNumber() ?? 0);

  const comparativoDisponivel = totalGastoAnterior > 0;
  const percentualComparativo = comparativoDisponivel
    ? ((totalGasto - totalGastoAnterior) / totalGastoAnterior) * 100
    : 0;
  const valorDiferenca = totalGasto - totalGastoAnterior;

  return {
    totalGasto: totalGasto.toFixed(2),
    totalEntrada: totalEntrada.toFixed(2),
    saldo: saldo.toFixed(2),
    comparativo: {
      percentual: Math.round(percentualComparativo * 10) / 10,
      valor: Math.abs(valorDiferenca).toFixed(2),
      disponivel: comparativoDisponivel,
    },
  };
}

// ---------------------------------------------------------------------------
// buscarGastosPorCategoriaAnalytics
// ---------------------------------------------------------------------------

const COR_OUTROS = "#6b7280";
const LIMITE_CATEGORIAS = 10;

export async function buscarGastosPorCategoriaAnalytics(
  contaFamiliaId: string,
  usuarioId: string,
  parceiroId: string | null,
  filtros: FiltrosAnalytics
): Promise<GastoCategoria[]> {
  const membroWhere = buildMembroWhere(filtros.membro, usuarioId, parceiroId);

  const gastos = await clientePrisma.gasto.groupBy({
    by: ["tagId"],
    where: {
      contaFamiliaId,
      data: { gte: filtros.dataInicio, lt: filtros.dataFim },
      ...(filtros.categoriaIds.length > 0 ? { tagId: { in: filtros.categoriaIds } } : {}),
      ...membroWhere,
    },
    _sum: { valor: true },
    orderBy: { _sum: { valor: "desc" } },
  });

  if (gastos.length === 0) return [];

  const total = gastos.reduce((acc, g) => acc + (g._sum.valor?.toNumber() ?? 0), 0);
  if (total === 0) return [];

  // Buscar nomes das tags
  const tagIds = gastos.map((g) => g.tagId).filter((id): id is string => id !== null);
  const tags = await clientePrisma.tag.findMany({
    where: { id: { in: tagIds } },
    select: { id: true, nome: true, cor: true },
  });
  const tagMap = new Map(tags.map((t) => [t.id, t]));

  const top = gastos.slice(0, LIMITE_CATEGORIAS);
  const resto = gastos.slice(LIMITE_CATEGORIAS);

  const resultado: GastoCategoria[] = top.map((g) => {
    const tag = g.tagId ? tagMap.get(g.tagId) : null;
    const valor = g._sum.valor?.toNumber() ?? 0;
    return {
      tagId: g.tagId,
      nome: tag?.nome ?? "Sem categoria",
      cor: tag?.cor ?? COR_OUTROS,
      valor: valor.toFixed(2),
      percentual: Math.round((valor / total) * 1000) / 10,
    };
  });

  if (resto.length > 0) {
    const valorOutros = resto.reduce((acc, g) => acc + (g._sum.valor?.toNumber() ?? 0), 0);
    resultado.push({
      tagId: null,
      nome: "Outros",
      cor: COR_OUTROS,
      valor: valorOutros.toFixed(2),
      percentual: Math.round((valorOutros / total) * 1000) / 10,
    });
  }

  return resultado;
}

// ---------------------------------------------------------------------------
// buscarTendenciaGastos
// ---------------------------------------------------------------------------

export async function buscarTendenciaGastos(
  contaFamiliaId: string,
  usuarioId: string,
  parceiroId: string | null,
  filtros: FiltrosAnalytics
): Promise<PontoTendencia[]> {
  const membroWhere = buildMembroWhere(filtros.membro, usuarioId, parceiroId);

  type LinhaGasto = { data: Date; total: string | number };
  type LinhaReceita = { data: Date; total: string | number };

  const dataInicioStr = filtros.dataInicio.toISOString().split("T")[0];
  const dataFimStr = filtros.dataFim.toISOString().split("T")[0];

  const membroIdGasto =
    filtros.membro === "meus" ? usuarioId :
    filtros.membro === "parceiro" ? parceiroId :
    null;

  const [linhasGasto, linhasReceita] = await Promise.all([
    clientePrisma.$queryRawUnsafe<LinhaGasto[]>(
      `SELECT date AS data, SUM(amount)::text AS total
       FROM spendings
       WHERE family_account_id = $1::uuid
         AND date >= $2::date
         AND date < $3::date
         AND ($4::uuid IS NULL OR created_by = $4::uuid)
       GROUP BY date
       ORDER BY date ASC`,
      contaFamiliaId,
      dataInicioStr,
      dataFimStr,
      membroIdGasto
    ),
    clientePrisma.$queryRaw<LinhaReceita[]>`
      SELECT
        COALESCE(reference_month, created_at::date) AS data,
        SUM(amount)::text AS total
      FROM incomes
      WHERE family_account_id = ${contaFamiliaId}::uuid
        AND COALESCE(reference_month, created_at::date) >= ${dataInicioStr}::date
        AND COALESCE(reference_month, created_at::date) < ${dataFimStr}::date
      GROUP BY COALESCE(reference_month, created_at::date)
      ORDER BY data ASC
    `,
  ]);

  const mapaGasto = new Map<string, number>(
    linhasGasto.map((l) => [
      l.data instanceof Date ? l.data.toISOString().split("T")[0] : String(l.data),
      Number(l.total),
    ])
  );
  const mapaReceita = new Map<string, number>(
    linhasReceita.map((l) => [
      l.data instanceof Date ? l.data.toISOString().split("T")[0] : String(l.data),
      Number(l.total),
    ])
  );

  const todasAsDatas = new Set([...mapaGasto.keys(), ...mapaReceita.keys()]);
  return Array.from(todasAsDatas)
    .sort()
    .map((data) => ({
      data,
      gasto: mapaGasto.get(data) ?? 0,
      entrada: mapaReceita.get(data) ?? 0,
    }));
}

// ---------------------------------------------------------------------------
// buscarDistribuicaoPorTipo
// ---------------------------------------------------------------------------

export async function buscarDistribuicaoPorTipo(
  contaFamiliaId: string,
  usuarioId: string,
  parceiroId: string | null,
  filtros: FiltrosAnalytics
): Promise<DistribuicaoTipo[]> {
  const membroWhere = buildMembroWhere(filtros.membro, usuarioId, parceiroId);

  const [agCartao, agDinheiro, agReceita] = await Promise.all([
    clientePrisma.gasto.aggregate({
      where: {
        contaFamiliaId,
        formaPagamento: "CARTAO",
        data: { gte: filtros.dataInicio, lt: filtros.dataFim },
        ...membroWhere,
      },
      _sum: { valor: true },
    }),
    clientePrisma.gasto.aggregate({
      where: {
        contaFamiliaId,
        formaPagamento: "DINHEIRO",
        data: { gte: filtros.dataInicio, lt: filtros.dataFim },
        ...membroWhere,
      },
      _sum: { valor: true },
    }),
    clientePrisma.receita.aggregate({
      where: {
        contaFamiliaId,
        OR: [
          { competencia: { gte: filtros.dataInicio, lt: filtros.dataFim } },
          {
            competencia: null,
            criadoEm: { gte: filtros.dataInicio, lt: filtros.dataFim },
          },
        ],
        ...membroWhere,
      },
      _sum: { valor: true },
    }),
  ]);

  const cartao = agCartao._sum.valor?.toNumber() ?? 0;
  const dinheiro = agDinheiro._sum.valor?.toNumber() ?? 0;
  const receita = agReceita._sum.valor?.toNumber() ?? 0;
  const total = cartao + dinheiro + receita;

  if (total === 0) return [];

  const pct = (v: number) => Math.round((v / total) * 1000) / 10;

  return (
    [
      { tipo: "CARTAO" as const, valor: cartao.toFixed(2), percentual: pct(cartao) },
      { tipo: "DINHEIRO" as const, valor: dinheiro.toFixed(2), percentual: pct(dinheiro) },
      { tipo: "RECEITA" as const, valor: receita.toFixed(2), percentual: pct(receita) },
    ] satisfies DistribuicaoTipo[]
  ).filter((d) => parseFloat(d.valor) > 0);
}

// ---------------------------------------------------------------------------
// listarTransacoesAnalytics
// ---------------------------------------------------------------------------

const LIMITE_PAGINA = 20;

type LinhaTransacaoAnalytics = {
  id: string;
  nome: string;
  valor: string;
  tipo: string;
  data: Date | string;
  tagId: string | null;
  tagNome: string | null;
  tagCor: string | null;
  cartaoNome: string | null;
  membroNome: string;
  membroId: string;
};

export async function listarTransacoesAnalytics(
  contaFamiliaId: string,
  usuarioId: string,
  parceiroId: string | null,
  filtros: FiltrosAnalytics
): Promise<{ itens: TransacaoAnalytics[]; total: number }> {
  const pagina = filtros.pag ?? 1;
  const offsetReal = (pagina - 1) * LIMITE_PAGINA;

  const dataInicioStr = filtros.dataInicio.toISOString().split("T")[0];
  const dataFimStr = filtros.dataFim.toISOString().split("T")[0];

  const membroIds: string[] = [];
  if (filtros.membro === "familia") {
    membroIds.push(usuarioId);
    if (parceiroId) membroIds.push(parceiroId);
  } else if (filtros.membro === "meus") {
    membroIds.push(usuarioId);
  } else if (filtros.membro === "parceiro" && parceiroId) {
    membroIds.push(parceiroId);
  } else if (filtros.membro === "parceiro") {
    return { itens: [], total: 0 };
  }

  type LinhaContagem = { total: number | bigint };

  const tiposFiltro = filtros.tiposGasto;
  const incluiGastos = tiposFiltro.length === 0 || tiposFiltro.includes("cartao") || tiposFiltro.includes("dinheiro");
  const incluiReceitas = tiposFiltro.length === 0 || tiposFiltro.includes("entrada");

  const categoriaFilter = filtros.categoriaIds.length > 0
    ? filtros.categoriaIds
    : null;
  const cartaoFilter = filtros.cartaoIds.length > 0
    ? filtros.cartaoIds
    : null;

  type QueryResult = LinhaTransacaoAnalytics[];

  let linhas: QueryResult = [];
  let contagemResult: LinhaContagem[];

  // Filtros de array passados como parâmetros para evitar SQL injection
  const categoriaParam = categoriaFilter; // string[] | null
  const cartaoParam = cartaoFilter;       // string[] | null

  if (incluiGastos && incluiReceitas) {
    const sqlCombinado = `
      SELECT * FROM (
        SELECT
          g.id::text,
          g.name AS nome,
          g.amount::text AS valor,
          CASE WHEN g.payment_method = 'card' THEN 'GASTO_CARTAO' ELSE 'GASTO_DINHEIRO' END AS tipo,
          g.date AS data,
          g.tag_id::text AS "tagId",
          t.name AS "tagNome",
          t.color AS "tagCor",
          cc.name AS "cartaoNome",
          u.name AS "membroNome",
          g.created_by::text AS "membroId"
        FROM spendings g
        LEFT JOIN tags t ON g.tag_id = t.id
        LEFT JOIN credit_cards cc ON g.credit_card_id = cc.id
        JOIN users u ON g.created_by = u.id
        WHERE g.family_account_id = $1::uuid
          AND g.date >= $2::date
          AND g.date < $3::date
          AND g.created_by = ANY($4::uuid[])
          AND ($5::uuid[] IS NULL OR g.tag_id = ANY($5::uuid[]))
          AND ($6::uuid[] IS NULL OR g.credit_card_id = ANY($6::uuid[]))
        UNION ALL
        SELECT
          r.id::text,
          COALESCE(r.description, 'Receita') AS nome,
          r.amount::text AS valor,
          'RECEITA' AS tipo,
          COALESCE(r.reference_month, r.created_at::date) AS data,
          NULL AS "tagId",
          NULL AS "tagNome",
          NULL AS "tagCor",
          NULL AS "cartaoNome",
          u.name AS "membroNome",
          r.created_by::text AS "membroId"
        FROM incomes r
        JOIN users u ON r.created_by = u.id
        WHERE r.family_account_id = $1::uuid
          AND COALESCE(r.reference_month, r.created_at::date) >= $2::date
          AND COALESCE(r.reference_month, r.created_at::date) < $3::date
          AND r.created_by = ANY($4::uuid[])
      ) sub
      ORDER BY data DESC, nome ASC
      LIMIT $7 OFFSET $8
    `;
    linhas = await clientePrisma.$queryRawUnsafe<QueryResult>(
      sqlCombinado,
      contaFamiliaId,
      dataInicioStr,
      dataFimStr,
      membroIds,
      categoriaParam,
      cartaoParam,
      LIMITE_PAGINA,
      offsetReal
    );

    const sqlContagem = `
      SELECT COUNT(*)::int AS total FROM (
        SELECT g.id FROM spendings g
        WHERE g.family_account_id = $1::uuid
          AND g.date >= $2::date
          AND g.date < $3::date
          AND g.created_by = ANY($4::uuid[])
          AND ($5::uuid[] IS NULL OR g.tag_id = ANY($5::uuid[]))
          AND ($6::uuid[] IS NULL OR g.credit_card_id = ANY($6::uuid[]))
        UNION ALL
        SELECT r.id FROM incomes r
        WHERE r.family_account_id = $1::uuid
          AND COALESCE(r.reference_month, r.created_at::date) >= $2::date
          AND COALESCE(r.reference_month, r.created_at::date) < $3::date
          AND r.created_by = ANY($4::uuid[])
      ) sub
    `;
    contagemResult = await clientePrisma.$queryRawUnsafe<LinhaContagem[]>(
      sqlContagem,
      contaFamiliaId,
      dataInicioStr,
      dataFimStr,
      membroIds,
      categoriaParam,
      cartaoParam
    );
  } else if (incluiGastos) {
    const sqlGastos = `
      SELECT
        g.id::text,
        g.name AS nome,
        g.amount::text AS valor,
        CASE WHEN g.payment_method = 'card' THEN 'GASTO_CARTAO' ELSE 'GASTO_DINHEIRO' END AS tipo,
        g.date AS data,
        g.tag_id::text AS "tagId",
        t.name AS "tagNome",
        t.color AS "tagCor",
        cc.name AS "cartaoNome",
        u.name AS "membroNome",
        g.created_by::text AS "membroId"
      FROM spendings g
      LEFT JOIN tags t ON g.tag_id = t.id
      LEFT JOIN credit_cards cc ON g.credit_card_id = cc.id
      JOIN users u ON g.created_by = u.id
      WHERE g.family_account_id = $1::uuid
        AND g.date >= $2::date
        AND g.date < $3::date
        AND g.created_by = ANY($4::uuid[])
        AND ($5::uuid[] IS NULL OR g.tag_id = ANY($5::uuid[]))
        AND ($6::uuid[] IS NULL OR g.credit_card_id = ANY($6::uuid[]))
      ORDER BY g.date DESC
      LIMIT $7 OFFSET $8
    `;
    linhas = await clientePrisma.$queryRawUnsafe<QueryResult>(
      sqlGastos,
      contaFamiliaId,
      dataInicioStr,
      dataFimStr,
      membroIds,
      categoriaParam,
      cartaoParam,
      LIMITE_PAGINA,
      offsetReal
    );

    const sqlContagemGastos = `
      SELECT COUNT(*)::int AS total FROM spendings
      WHERE family_account_id = $1::uuid
        AND date >= $2::date
        AND date < $3::date
        AND created_by = ANY($4::uuid[])
        AND ($5::uuid[] IS NULL OR tag_id = ANY($5::uuid[]))
        AND ($6::uuid[] IS NULL OR credit_card_id = ANY($6::uuid[]))
    `;
    contagemResult = await clientePrisma.$queryRawUnsafe<LinhaContagem[]>(
      sqlContagemGastos,
      contaFamiliaId,
      dataInicioStr,
      dataFimStr,
      membroIds,
      categoriaParam,
      cartaoParam
    );
  } else {
    // Apenas receitas
    const sqlReceitas = `
      SELECT
        r.id::text,
        COALESCE(r.description, 'Receita') AS nome,
        r.amount::text AS valor,
        'RECEITA' AS tipo,
        COALESCE(r.reference_month, r.created_at::date) AS data,
        NULL AS "tagId",
        NULL AS "tagNome",
        NULL AS "tagCor",
        NULL AS "cartaoNome",
        u.name AS "membroNome",
        r.created_by::text AS "membroId"
      FROM incomes r
      JOIN users u ON r.created_by = u.id
      WHERE r.family_account_id = $1::uuid
        AND COALESCE(r.reference_month, r.created_at::date) >= $2::date
        AND COALESCE(r.reference_month, r.created_at::date) < $3::date
        AND r.created_by = ANY($4::uuid[])
      ORDER BY data DESC
      LIMIT $5 OFFSET $6
    `;
    linhas = await clientePrisma.$queryRawUnsafe<QueryResult>(
      sqlReceitas,
      contaFamiliaId,
      dataInicioStr,
      dataFimStr,
      membroIds,
      LIMITE_PAGINA,
      offsetReal
    );

    const sqlContagemReceitas = `
      SELECT COUNT(*)::int AS total FROM incomes
      WHERE family_account_id = $1::uuid
        AND COALESCE(reference_month, created_at::date) >= $2::date
        AND COALESCE(reference_month, created_at::date) < $3::date
        AND created_by = ANY($4::uuid[])
    `;
    contagemResult = await clientePrisma.$queryRawUnsafe<LinhaContagem[]>(
      sqlContagemReceitas,
      contaFamiliaId,
      dataInicioStr,
      dataFimStr,
      membroIds
    );
  }

  const total = Number(contagemResult[0]?.total ?? 0);

  const itens: TransacaoAnalytics[] = linhas.map((l) => ({
    id: l.id,
    nome: l.nome,
    valor: l.valor,
    tipo: l.tipo as TransacaoAnalytics["tipo"],
    data: l.data instanceof Date ? l.data.toISOString().split("T")[0] : String(l.data),
    tagId: l.tagId ?? null,
    tagNome: l.tagNome ?? null,
    tagCor: l.tagCor ?? null,
    cartaoNome: l.cartaoNome ?? null,
    membroNome: l.membroNome,
    membroId: l.membroId,
  }));

  return { itens, total };
}

// ---------------------------------------------------------------------------
// buscarDadosAnalytics (agregação completa)
// ---------------------------------------------------------------------------

export async function buscarDadosAnalytics(
  contaFamiliaId: string,
  usuarioId: string,
  parceiroId: string | null,
  filtros: FiltrosAnalytics,
  limiteOrcamento: { limiteMensal: string; ativo: boolean } | null
): Promise<DadosAnalytics> {
  const [kpi, gastosPorCategoria, tendencia, distribuicaoTipo, { itens, total }] =
    await Promise.all([
      buscarKPIAnalytics(contaFamiliaId, usuarioId, parceiroId, filtros),
      buscarGastosPorCategoriaAnalytics(contaFamiliaId, usuarioId, parceiroId, filtros),
      buscarTendenciaGastos(contaFamiliaId, usuarioId, parceiroId, filtros),
      buscarDistribuicaoPorTipo(contaFamiliaId, usuarioId, parceiroId, filtros),
      listarTransacoesAnalytics(contaFamiliaId, usuarioId, parceiroId, filtros),
    ]);

  const pagina = filtros.pag ?? 1;
  const totalPaginas = Math.max(1, Math.ceil(total / LIMITE_PAGINA));

  let limiteOrcamentoDados: LimiteOrcamentoDados = {
    configurado: false,
    limiteMensal: null,
    percentualUtilizado: 0,
    atingiuAlerta: false,
  };

  if (limiteOrcamento?.ativo && limiteOrcamento.limiteMensal) {
    const limite = parseFloat(limiteOrcamento.limiteMensal);
    const gasto = parseFloat(kpi.totalGasto);
    const percentual = limite > 0 ? (gasto / limite) * 100 : 0;
    limiteOrcamentoDados = {
      configurado: true,
      limiteMensal: limiteOrcamento.limiteMensal,
      percentualUtilizado: Math.round(percentual * 10) / 10,
      atingiuAlerta: percentual >= 80,
    };
  }

  return {
    kpi,
    gastosPorCategoria,
    tendencia,
    distribuicaoTipo,
    transacoes: { itens, total, pagina, totalPaginas },
    limiteOrcamento: limiteOrcamentoDados,
  };
}
