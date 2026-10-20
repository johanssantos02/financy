"use server";

import { revalidatePath } from "next/cache";

import { schemaGasto } from "@/src/entities/gasto";
import type { ResumoCartao } from "@/src/entities/cartao";
import type { ResumoTag } from "@/src/entities/tag";
import { listarCartoes } from "@/src/entities/cartao/server";
import { listarTagsPorTipo } from "@/src/entities/tag/server";
import { obterSaldoMes } from "@/src/entities/despesa/server";
import { clientePrisma } from "@/src/shared/api/prisma";
import { competenciaAtual, competenciaDe, paraDataBanco } from "@/src/shared/lib/datas";
import { lerFormData, type EntradaFormulario } from "@/src/shared/lib/formulario";
import { formatarValor } from "@/src/shared/lib/moeda";
import {
  erroDeValidacao,
  falha,
  sucesso,
  tratarErro,
  type Resultado,
} from "@/src/shared/lib/resultado";
import { obterContextoUsuario } from "@/src/shared/lib/sessao";

const ROTA_DESPESAS = "/despesas";

const CARTAO_NAO_ENCONTRADO = "CARTAO_NAO_ENCONTRADO";

class ErroLimiteExcedido extends Error {
  constructor(public readonly limiteDisponivel: number) {
    super("Limite insuficiente.");
  }
}

export async function criarGasto(entrada: EntradaFormulario): Promise<Resultado<{ id: string }>> {
  try {
    const contexto = await obterContextoUsuario();
    if (!contexto.sucesso) return contexto;
    const { usuarioId, contaFamiliaId } = contexto.dados;

    const validacao = schemaGasto.safeParse(lerFormData(entrada));
    if (!validacao.success) return erroDeValidacao(validacao.error);
    const dados = validacao.data;

    const dataGasto = paraDataBanco(dados.data);

    if (dados.tagId) {
      const tagValida = await clientePrisma.tag.findFirst({
        where: { id: dados.tagId, contaFamiliaId, tipo: "GASTOS" },
        select: { id: true },
      });
      if (!tagValida) {
        return falha("VALIDACAO", "Tag inválida.", {
          tagId: ["Tag não encontrada ou inválida."],
        });
      }
    }

    if (dados.formaPagamento === "CARTAO") {
      const cartaoId = dados.cartaoId!;

      try {
        const gasto = await clientePrisma.$transaction(async (tx) => {
          // SELECT FOR UPDATE garante exclusão mútua no limite do cartão (FR-012)
          type LinhaCartao = { limite_disponivel: string };
          const linhas = await tx.$queryRaw<LinhaCartao[]>`
            SELECT (credit_limit - used_limit)::text AS limite_disponivel
            FROM "credit_cards"
            WHERE id = ${cartaoId}::uuid
              AND family_account_id = ${contaFamiliaId}::uuid
            FOR UPDATE
          `;

          if (linhas.length === 0) {
            throw new Error(CARTAO_NAO_ENCONTRADO);
          }

          const limiteDisponivel = parseFloat(linhas[0].limite_disponivel);
          const valor = parseFloat(dados.valor);

          if (limiteDisponivel < valor) {
            throw new ErroLimiteExcedido(limiteDisponivel);
          }

          await tx.cartaoCredito.update({
            where: { id: cartaoId },
            data: { limiteUsado: { increment: valor } },
          });

          return tx.gasto.create({
            data: {
              contaFamiliaId,
              criadoPorId: usuarioId,
              nome: dados.nome,
              valor: dados.valor,
              formaPagamento: "CARTAO",
              data: dataGasto,
              cartaoId,
              tagId: dados.tagId ?? null,
            },
            select: { id: true },
          });
        });

        revalidatePath(ROTA_DESPESAS);
        return sucesso({ id: gasto.id });
      } catch (err) {
        if (err instanceof Error && err.message === CARTAO_NAO_ENCONTRADO) {
          return falha("NAO_ENCONTRADO", "Cartão não encontrado.");
        }
        if (err instanceof ErroLimiteExcedido) {
          return falha(
            "VALIDACAO",
            `Limite insuficiente. Disponível: ${formatarValor(err.limiteDisponivel.toFixed(2))}.`,
            { cartaoId: [`Limite disponível: ${formatarValor(err.limiteDisponivel.toFixed(2))}`] }
          );
        }
        return tratarErro(err);
      }
    }

    // Dinheiro: verifica saldo do mês antes de inserir
    const saldoAtual = parseFloat(await obterSaldoMes(contaFamiliaId, competenciaDe(dados.data)));
    if (saldoAtual < parseFloat(dados.valor)) {
      return falha(
        "VALIDACAO",
        `Saldo insuficiente. Disponível: ${formatarValor(saldoAtual.toFixed(2))}.`
      );
    }

    const gasto = await clientePrisma.gasto.create({
      data: {
        contaFamiliaId,
        criadoPorId: usuarioId,
        nome: dados.nome,
        valor: dados.valor,
        formaPagamento: "DINHEIRO",
        data: dataGasto,
        tagId: dados.tagId ?? null,
      },
      select: { id: true },
    });

    revalidatePath(ROTA_DESPESAS);
    return sucesso({ id: gasto.id });
  } catch (erro) {
    return tratarErro(erro);
  }
}

export async function buscarTagsGasto(): Promise<Resultado<ResumoTag[]>> {
  try {
    const contexto = await obterContextoUsuario();
    if (!contexto.sucesso) return contexto;
    const tags = await listarTagsPorTipo(contexto.dados.contaFamiliaId, "GASTOS");
    return sucesso(tags);
  } catch (erro) {
    return tratarErro(erro);
  }
}

export async function buscarCartoesFamilia(): Promise<Resultado<ResumoCartao[]>> {
  try {
    const contexto = await obterContextoUsuario();
    if (!contexto.sucesso) return contexto;
    const cartoes = await listarCartoes(contexto.dados.contaFamiliaId);
    return sucesso(cartoes);
  } catch (erro) {
    return tratarErro(erro);
  }
}

export async function excluirGasto(entrada: { id: string }): Promise<Resultado<{ id: string }>> {
  try {
    const contexto = await obterContextoUsuario();
    if (!contexto.sucesso) return contexto;
    const { contaFamiliaId } = contexto.dados;

    const gasto = await clientePrisma.gasto.findFirst({
      where: { id: entrada.id, contaFamiliaId, formaPagamento: "DINHEIRO" },
      select: { id: true },
    });

    if (!gasto) {
      return falha("NAO_ENCONTRADO", "Gasto não encontrado.");
    }

    await clientePrisma.gasto.delete({ where: { id: gasto.id } });

    revalidatePath("/dashboard");
    return sucesso({ id: gasto.id });
  } catch (erro) {
    return tratarErro(erro);
  }
}

export async function buscarSaldoAtual(): Promise<Resultado<string>> {
  try {
    const contexto = await obterContextoUsuario();
    if (!contexto.sucesso) return contexto;
    const saldo = await obterSaldoMes(contexto.dados.contaFamiliaId, competenciaAtual());
    return sucesso(saldo);
  } catch (erro) {
    return tratarErro(erro);
  }
}
