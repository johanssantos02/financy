import "server-only";

import { clientePrisma, type Prisma } from "@/src/shared/api/prisma";
import { deDataBanco } from "@/src/shared/lib/datas";

import type { FiltrosHistorico, ResumoGasto, TipoTransacao, TransacaoUnificada } from "../model/tipos";

const selecaoGasto = {
  id: true,
  nome: true,
  valor: true,
  formaPagamento: true,
  data: true,
  cartaoId: true,
  cartao: { select: { nome: true } },
  tagId: true,
  tag: { select: { nome: true } },
} satisfies Prisma.GastoSelect;

type GastoSelecionado = Prisma.GastoGetPayload<{ select: typeof selecaoGasto }>;

const paraResumoGasto = (gasto: GastoSelecionado): ResumoGasto => ({
  id: gasto.id,
  nome: gasto.nome,
  valor: gasto.valor.toFixed(2),
  formaPagamento: gasto.formaPagamento === "CARTAO" ? "CARTAO" : "DINHEIRO",
  data: deDataBanco(gasto.data),
  cartaoId: gasto.cartaoId,
  cartaoNome: gasto.cartao?.nome ?? null,
  tagId: gasto.tagId,
  tagNome: gasto.tag?.nome ?? null,
});

export async function listarGastosPorContaEMes(
  contaFamiliaId: string,
  competencia: string
): Promise<ResumoGasto[]> {
  const ano = Number(competencia.slice(0, 4));
  const mes = Number(competencia.slice(5, 7));
  const inicio = new Date(Date.UTC(ano, mes - 1, 1));
  const fim = new Date(Date.UTC(ano, mes, 1));

  const gastos = await clientePrisma.gasto.findMany({
    where: {
      contaFamiliaId,
      data: { gte: inicio, lt: fim },
    },
    select: selecaoGasto,
    orderBy: { data: "desc" },
  });
  return gastos.map(paraResumoGasto);
}

type LinhaTransacaoDB = {
  id: string;
  nome: string;
  valor: string;
  tipo: string;
  criadoEm: Date;
  editavel: boolean;
};

type LinhaContagem = { total: number | bigint };

export async function listarTransacoesUnificadas(
  contaFamiliaId: string,
  filtros: FiltrosHistorico
): Promise<TransacaoUnificada[]> {
  const buscaParam = filtros.busca ? `%${filtros.busca}%` : "%";
  const offset = (filtros.pagina - 1) * filtros.limite;

  const linhas = await clientePrisma.$queryRaw<LinhaTransacaoDB[]>`
    (
      SELECT
        g.id::text,
        g.name AS nome,
        g.amount::text AS valor,
        'GASTO_DINHEIRO'::text AS tipo,
        g.created_at AS "criadoEm",
        TRUE AS editavel
      FROM spendings g
      WHERE g.family_account_id = ${contaFamiliaId}::uuid
        AND g.payment_method = 'cash'
        AND g.name ILIKE ${buscaParam}
    )
    UNION ALL
    (
      SELECT
        pd.id::text,
        d.name AS nome,
        d.amount::text AS valor,
        'DESPESA_PAGA'::text AS tipo,
        pd.paid_at AS "criadoEm",
        FALSE::boolean AS editavel
      FROM expense_payments pd
      JOIN expenses d ON d.id = pd.expense_id
      WHERE d.family_account_id = ${contaFamiliaId}::uuid
        AND d.name ILIKE ${buscaParam}
        AND d.deleted_at IS NULL
    )
    ORDER BY "criadoEm" DESC
    LIMIT ${filtros.limite} OFFSET ${offset}
  `;

  return linhas.map((linha) => ({
    id: linha.id,
    nome: linha.nome,
    valor: linha.valor,
    tipo: linha.tipo as TipoTransacao,
    criadoEm: linha.criadoEm.toISOString(),
    editavel: linha.editavel,
  }));
}

export async function contarTransacoesUnificadas(
  contaFamiliaId: string,
  filtros: FiltrosHistorico
): Promise<number> {
  const buscaParam = filtros.busca ? `%${filtros.busca}%` : "%";

  const [contagemGastos, contagemPagamentos] = await Promise.all([
    clientePrisma.$queryRaw<LinhaContagem[]>`
      SELECT COUNT(*)::int AS total
      FROM spendings
      WHERE family_account_id = ${contaFamiliaId}::uuid
        AND payment_method = 'cash'
        AND name ILIKE ${buscaParam}
    `,
    clientePrisma.$queryRaw<LinhaContagem[]>`
      SELECT COUNT(*)::int AS total
      FROM expense_payments pd
      JOIN expenses d ON d.id = pd.expense_id
      WHERE d.family_account_id = ${contaFamiliaId}::uuid
        AND d.name ILIKE ${buscaParam}
        AND d.deleted_at IS NULL
    `,
  ]);

  return (
    Number(contagemGastos[0]?.total ?? 0) +
    Number(contagemPagamentos[0]?.total ?? 0)
  );
}

export async function somarGastosPorMes(
  contaFamiliaId: string,
  competencia: string
): Promise<string> {
  const ano = Number(competencia.slice(0, 4));
  const mes = Number(competencia.slice(5, 7));
  const inicio = new Date(Date.UTC(ano, mes - 1, 1));
  const fim = new Date(Date.UTC(ano, mes, 1));

  const agregado = await clientePrisma.gasto.aggregate({
    where: {
      contaFamiliaId,
      data: { gte: inicio, lt: fim },
    },
    _sum: { valor: true },
  });
  return (agregado._sum.valor?.toNumber() ?? 0).toFixed(2);
}
