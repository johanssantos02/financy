import "server-only";

import { clientePrisma, type Prisma } from "@/src/shared/api/prisma";
import { normalizarNome } from "@/src/shared/lib/texto";

import type { DetalheCartao, ResumoCartao } from "../model/tipos";

const selecaoCartao = {
  id: true,
  nome: true,
  instituicao: true,
  limite: true,
  limiteUsado: true,
  diaFechamento: true,
  diaVencimento: true,
  cor: true,
} satisfies Prisma.CartaoCreditoSelect;

type CartaoSelecionado = Prisma.CartaoCreditoGetPayload<{ select: typeof selecaoCartao }>;

const paraResumoCartao = (cartao: CartaoSelecionado): ResumoCartao => ({
  id: cartao.id,
  nome: cartao.nome,
  instituicao: cartao.instituicao,
  limite: cartao.limite.toFixed(2),
  limiteUsado: cartao.limiteUsado.toFixed(2),
  diaFechamento: cartao.diaFechamento,
  diaVencimento: cartao.diaVencimento,
  cor: cartao.cor,
});

export async function listarCartoes(contaFamiliaId: string): Promise<ResumoCartao[]> {
  const cartoes = await clientePrisma.cartaoCredito.findMany({
    where: { contaFamiliaId },
    select: selecaoCartao,
    orderBy: { nome: "asc" },
  });
  return cartoes.map(paraResumoCartao);
}

export async function obterCartaoPorId(
  contaFamiliaId: string,
  id: string
): Promise<DetalheCartao | null> {
  const cartao = await clientePrisma.cartaoCredito.findFirst({
    where: { id, contaFamiliaId },
    select: selecaoCartao,
  });
  if (!cartao) return null;
  return {
    id: cartao.id,
    nome: cartao.nome,
    instituicao: cartao.instituicao,
    limite: cartao.limite.toFixed(2),
    diaFechamento: cartao.diaFechamento,
    diaVencimento: cartao.diaVencimento,
    cor: cartao.cor,
  };
}

export async function existeNomeCartao(
  contaFamiliaId: string,
  nome: string,
  ignorarId?: string
): Promise<boolean> {
  const existente = await clientePrisma.cartaoCredito.findFirst({
    where: {
      contaFamiliaId,
      nomeNormalizado: normalizarNome(nome),
      ...(ignorarId ? { id: { not: ignorarId } } : {}),
    },
    select: { id: true },
  });
  return existente !== null;
}
