"use server";

import { revalidatePath } from "next/cache";

import {
  schemaCartao,
  schemaEditarCartao,
  schemaIdCartao,
} from "@/src/entities/cartao";
import { existeNomeCartao, obterCartaoPorId } from "@/src/entities/cartao/server";
import { clientePrisma } from "@/src/shared/api/prisma";
import { lerFormData, type EntradaFormulario } from "@/src/shared/lib/formulario";
import {
  codigoErroPrisma,
  erroDeValidacao,
  falha,
  sucesso,
  tratarErro,
  type Resultado,
} from "@/src/shared/lib/resultado";
import { obterContextoUsuario } from "@/src/shared/lib/sessao";
import { normalizarNome } from "@/src/shared/lib/texto";

const ROTA_CARTOES = "/cartoes";
const MENSAGEM_NOME_EM_USO = "Já existe um cartão com este nome.";
const MENSAGEM_NAO_ENCONTRADO = "Cartão não encontrado.";

export async function criarCartao(entrada: EntradaFormulario): Promise<Resultado<{ id: string }>> {
  try {
    const contexto = await obterContextoUsuario();
    if (!contexto.sucesso) return contexto;
    const { contaFamiliaId } = contexto.dados;

    const validacao = schemaCartao.safeParse(lerFormData(entrada));
    if (!validacao.success) return erroDeValidacao(validacao.error);
    const dados = validacao.data;

    if (await existeNomeCartao(contaFamiliaId, dados.nome)) {
      return falha("CONFLITO", MENSAGEM_NOME_EM_USO);
    }

    const cartao = await clientePrisma.cartaoCredito.create({
      data: {
        contaFamiliaId,
        nome: dados.nome,
        nomeNormalizado: normalizarNome(dados.nome),
        instituicao: dados.instituicao,
        limite: dados.limite,
        diaFechamento: dados.diaFechamento,
        diaVencimento: dados.diaVencimento,
        cor: dados.cor ?? null,
      },
      select: { id: true },
    });

    revalidatePath(ROTA_CARTOES);
    return sucesso({ id: cartao.id });
  } catch (erro) {
    if (codigoErroPrisma(erro) === "P2002") return falha("CONFLITO", MENSAGEM_NOME_EM_USO);
    return tratarErro(erro);
  }
}

export async function editarCartao(entrada: EntradaFormulario): Promise<Resultado<{ id: string }>> {
  try {
    const contexto = await obterContextoUsuario();
    if (!contexto.sucesso) return contexto;
    const { contaFamiliaId } = contexto.dados;

    const validacao = schemaEditarCartao.safeParse(lerFormData(entrada));
    if (!validacao.success) return erroDeValidacao(validacao.error);
    const dados = validacao.data;

    if (!(await obterCartaoPorId(contaFamiliaId, dados.id))) {
      return falha("NAO_ENCONTRADO", MENSAGEM_NAO_ENCONTRADO);
    }

    if (await existeNomeCartao(contaFamiliaId, dados.nome, dados.id)) {
      return falha("CONFLITO", MENSAGEM_NOME_EM_USO);
    }

    const { count } = await clientePrisma.cartaoCredito.updateMany({
      where: { id: dados.id, contaFamiliaId },
      data: {
        nome: dados.nome,
        nomeNormalizado: normalizarNome(dados.nome),
        instituicao: dados.instituicao,
        limite: dados.limite,
        diaFechamento: dados.diaFechamento,
        diaVencimento: dados.diaVencimento,
        cor: dados.cor ?? null,
      },
    });

    if (count === 0) return falha("NAO_ENCONTRADO", MENSAGEM_NAO_ENCONTRADO);

    revalidatePath(ROTA_CARTOES);
    return sucesso({ id: dados.id });
  } catch (erro) {
    if (codigoErroPrisma(erro) === "P2002") return falha("CONFLITO", MENSAGEM_NOME_EM_USO);
    return tratarErro(erro);
  }
}

export async function excluirCartao(entrada: EntradaFormulario): Promise<Resultado<{ id: string }>> {
  try {
    const contexto = await obterContextoUsuario();
    if (!contexto.sucesso) return contexto;
    const { usuarioId, contaFamiliaId } = contexto.dados;

    const validacao = schemaIdCartao.safeParse(lerFormData(entrada));
    if (!validacao.success) return erroDeValidacao(validacao.error);
    const { id } = validacao.data;

    // O papel é relido do banco porque o token da sessão pode estar desatualizado.
    const usuario = await clientePrisma.user.findUnique({
      where: { id: usuarioId },
      select: { role: true },
    });
    if (usuario?.role !== "ADMIN") {
      return falha("SEM_PERMISSAO", "Apenas administradores podem excluir cartões.");
    }

    const { count } = await clientePrisma.cartaoCredito.deleteMany({
      where: { id, contaFamiliaId },
    });

    if (count === 0) return falha("NAO_ENCONTRADO", MENSAGEM_NAO_ENCONTRADO);

    revalidatePath(ROTA_CARTOES);
    return sucesso({ id });
  } catch (erro) {
    if (codigoErroPrisma(erro) === "P2003") {
      return falha("CONFLITO", "Este cartão possui registros vinculados e não pode ser excluído.");
    }
    return tratarErro(erro);
  }
}
