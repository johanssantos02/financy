import "server-only";

import { clientePrisma, type Prisma } from "@/src/shared/api/prisma";
import {
  deDataBanco,
  fimDaCompetencia,
  hojeEmSaoPaulo,
  inicioDaCompetencia,
  paraDataBanco,
  somarMeses,
} from "@/src/shared/lib/datas";

import { agruparEOrdenar, calcularOcorrencias, normalizarNome } from "../model/regras";
import { contarFiltros, type FiltrosDespesa } from "../model/schemas";
import type { DespesaBase, DetalheDespesa, ListagemDespesas } from "../model/tipos";

const selecaoDespesa = {
  id: true,
  nome: true,
  valor: true,
  vencimento: true,
  lancamento: true,
  recorrente: true,
  descricao: true,
  excluidoEm: true,
  tags: { select: { tag: { select: { nome: true } } } },
} satisfies Prisma.DespesaSelect;

type DespesaSelecionada = Prisma.DespesaGetPayload<{ select: typeof selecaoDespesa }>;

const paraDespesaBase = (despesa: DespesaSelecionada): DespesaBase => ({
  id: despesa.id,
  nome: despesa.nome,
  valor: despesa.valor.toFixed(2),
  vencimento: deDataBanco(despesa.vencimento),
  recorrente: despesa.recorrente,
  descricao: despesa.descricao,
  tags: despesa.tags.map(({ tag }) => tag.nome),
  excluidoEm: despesa.excluidoEm ? deDataBanco(despesa.excluidoEm) : null,
});

// Busca no banco só o que pode aparecer na competência; a vigência exata e a situação
// são resolvidas pelas regras de domínio.
const filtroVigencia = (competencia: string): Prisma.DespesaWhereInput => {
  const inicio = paraDataBanco(inicioDaCompetencia(competencia));
  const fim = paraDataBanco(fimDaCompetencia(competencia));
  const inicioProximaCompetencia = paraDataBanco(
    inicioDaCompetencia(somarMeses(competencia, 1))
  );

  return {
    OR: [
      {
        recorrente: true,
        vencimento: { lte: fim },
        OR: [{ excluidoEm: null }, { excluidoEm: { gte: inicioProximaCompetencia } }],
      },
      { recorrente: false, excluidoEm: null, vencimento: { gte: inicio, lte: fim } },
    ],
  };
};

const filtroTexto = (q: string): Prisma.DespesaWhereInput => ({
  OR: [
    { nome: { contains: q, mode: "insensitive" } },
    { descricao: { contains: q, mode: "insensitive" } },
    { tags: { some: { tag: { nome: { contains: q, mode: "insensitive" } } } } },
  ],
});

export async function listarDespesas(
  contaFamiliaId: string,
  filtros: FiltrosDespesa
): Promise<ListagemDespesas> {
  const condicoes: Prisma.DespesaWhereInput[] = [filtroVigencia(filtros.competencia)];
  if (filtros.q) condicoes.push(filtroTexto(filtros.q));
  if (filtros.recorrente !== null) condicoes.push({ recorrente: filtros.recorrente });
  if (filtros.tags.length > 0) {
    condicoes.push({
      tags: {
        some: { tag: { nomeNormalizado: { in: filtros.tags.map(normalizarNome) } } },
      },
    });
  }

  const [despesas, pagamentos] = await Promise.all([
    clientePrisma.despesa.findMany({
      where: { contaFamiliaId, AND: condicoes },
      select: selecaoDespesa,
    }),
    clientePrisma.pagamentoDespesa.findMany({
      where: {
        competencia: paraDataBanco(inicioDaCompetencia(filtros.competencia)),
        despesa: { contaFamiliaId },
      },
      select: { despesaId: true, pagoEm: true, pagoPor: { select: { name: true } } },
    }),
  ]);

  const ocorrencias = calcularOcorrencias(
    despesas.map(paraDespesaBase),
    pagamentos.map((p) => ({
      despesaId: p.despesaId,
      pagoEm: p.pagoEm.toISOString(),
      pagoPor: p.pagoPor.name,
    })),
    filtros.competencia,
    hojeEmSaoPaulo()
  );

  const filtradas =
    filtros.situacoes.length > 0
      ? ocorrencias.filter((o) => filtros.situacoes.includes(o.situacao))
      : ocorrencias;

  return {
    competencia: filtros.competencia,
    grupos: agruparEOrdenar(filtradas),
    totalFiltrosAplicados: contarFiltros(filtros),
  };
}

export async function listarTags(contaFamiliaId: string): Promise<string[]> {
  const tags = await clientePrisma.tag.findMany({
    where: { contaFamiliaId },
    select: { nome: true },
    orderBy: { nome: "asc" },
  });
  return tags.map((tag) => tag.nome);
}

export async function obterDespesaPorId(
  contaFamiliaId: string,
  id: string,
  { incluirExcluidas = false }: { incluirExcluidas?: boolean } = {}
): Promise<(DetalheDespesa & { excluidoEm: string | null }) | null> {
  const despesa = await clientePrisma.despesa.findFirst({
    where: { id, contaFamiliaId, ...(incluirExcluidas ? {} : { excluidoEm: null }) },
    select: selecaoDespesa,
  });
  if (!despesa) return null;

  return {
    ...paraDespesaBase(despesa),
    lancamento: deDataBanco(despesa.lancamento),
  };
}

export async function existeNomeDespesa(
  contaFamiliaId: string,
  nome: string,
  ignorarId?: string
): Promise<boolean> {
  const existente = await clientePrisma.despesa.findFirst({
    where: {
      contaFamiliaId,
      nomeNormalizado: normalizarNome(nome),
      ...(ignorarId ? { id: { not: ignorarId } } : {}),
    },
    select: { id: true },
  });
  return existente !== null;
}

export async function sincronizarTags(
  tx: Prisma.TransactionClient,
  contaFamiliaId: string,
  despesaId: string,
  nomes: string[]
): Promise<void> {
  const tags = await Promise.all(
    nomes.map((nome) =>
      tx.tag.upsert({
        where: {
          contaFamiliaId_nomeNormalizado: { contaFamiliaId, nomeNormalizado: normalizarNome(nome) },
        },
        create: { contaFamiliaId, nome, nomeNormalizado: normalizarNome(nome) },
        update: {},
        select: { id: true },
      })
    )
  );

  await tx.despesaTag.deleteMany({ where: { despesaId } });
  if (tags.length > 0) {
    await tx.despesaTag.createMany({
      data: tags.map((tag) => ({ despesaId, tagId: tag.id })),
    });
  }
}
