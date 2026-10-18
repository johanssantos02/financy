import "server-only";

import { clientePrisma, type Prisma } from "@/src/shared/api/prisma";
import { deDataBanco } from "@/src/shared/lib/datas";

import type { DetalheReceita, ResumoReceita } from "../model/tipos";

const selecaoReceita = {
  id: true,
  valor: true,
  tipo: true,
  descricao: true,
  competencia: true,
} satisfies Prisma.ReceitaSelect;

type ReceitaSelecionada = Prisma.ReceitaGetPayload<{ select: typeof selecaoReceita }>;

const paraResumoReceita = (receita: ReceitaSelecionada): ResumoReceita => ({
  id: receita.id,
  valor: receita.valor.toFixed(2),
  tipo: receita.tipo as ResumoReceita["tipo"],
  descricao: receita.descricao,
  competencia: receita.competencia ? deDataBanco(receita.competencia).slice(0, 7) : null,
});

export async function listarReceitas(contaFamiliaId: string): Promise<ResumoReceita[]> {
  const receitas = await clientePrisma.receita.findMany({
    where: { contaFamiliaId },
    select: selecaoReceita,
    orderBy: { criadoEm: "desc" },
  });
  return receitas.map(paraResumoReceita);
}

export async function obterReceitaPorId(
  contaFamiliaId: string,
  id: string
): Promise<DetalheReceita | null> {
  const receita = await clientePrisma.receita.findFirst({
    where: { id, contaFamiliaId },
    select: selecaoReceita,
  });
  if (!receita) return null;
  return paraResumoReceita(receita);
}
