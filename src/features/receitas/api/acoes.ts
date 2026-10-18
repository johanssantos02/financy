"use server";

import { revalidatePath } from "next/cache";

import {
  schemaEditarReceita,
  schemaIdReceita,
  schemaReceita,
} from "@/src/entities/receita";
import { clientePrisma } from "@/src/shared/api/prisma";
import { inicioDaCompetencia, paraDataBanco } from "@/src/shared/lib/datas";
import { lerFormData, type EntradaFormulario } from "@/src/shared/lib/formulario";
import {
  erroDeValidacao,
  falha,
  sucesso,
  tratarErro,
  type Resultado,
} from "@/src/shared/lib/resultado";
import { obterContextoUsuario } from "@/src/shared/lib/sessao";

const ROTA_ENTRADAS = "/entradas";

export async function criarReceita(entrada: EntradaFormulario): Promise<Resultado<{ id: string }>> {
  try {
    const contexto = await obterContextoUsuario();
    if (!contexto.sucesso) return contexto;
    const { usuarioId, contaFamiliaId } = contexto.dados;

    const validacao = schemaReceita.safeParse(lerFormData(entrada));
    if (!validacao.success) return erroDeValidacao(validacao.error);
    const dados = validacao.data;

    const competencia =
      dados.tipo === "SALARIO" && dados.competencia
        ? paraDataBanco(inicioDaCompetencia(dados.competencia))
        : null;

    const receita = await clientePrisma.receita.create({
      data: {
        contaFamiliaId,
        criadoPorId: usuarioId,
        valor: dados.valor,
        tipo: dados.tipo,
        descricao: dados.descricao ?? null,
        competencia,
      },
      select: { id: true },
    });

    revalidatePath(ROTA_ENTRADAS);
    return sucesso({ id: receita.id });
  } catch (erro) {
    return tratarErro(erro);
  }
}

export async function editarReceita(entrada: EntradaFormulario): Promise<Resultado<{ id: string }>> {
  try {
    const contexto = await obterContextoUsuario();
    if (!contexto.sucesso) return contexto;
    const { contaFamiliaId } = contexto.dados;

    const validacao = schemaEditarReceita.safeParse(lerFormData(entrada));
    if (!validacao.success) return erroDeValidacao(validacao.error);
    const dados = validacao.data;

    const competencia =
      dados.tipo === "SALARIO" && dados.competencia
        ? paraDataBanco(inicioDaCompetencia(dados.competencia))
        : null;

    const { count } = await clientePrisma.receita.updateMany({
      where: { id: dados.id, contaFamiliaId },
      data: {
        valor: dados.valor,
        tipo: dados.tipo,
        descricao: dados.descricao ?? null,
        competencia,
      },
    });

    if (count === 0) return falha("NAO_ENCONTRADO", "Receita não encontrada.");

    revalidatePath(ROTA_ENTRADAS);
    return sucesso({ id: dados.id });
  } catch (erro) {
    return tratarErro(erro);
  }
}

export async function excluirReceita(entrada: EntradaFormulario): Promise<Resultado<{ id: string }>> {
  try {
    const contexto = await obterContextoUsuario();
    if (!contexto.sucesso) return contexto;
    const { usuarioId, contaFamiliaId } = contexto.dados;

    const validacao = schemaIdReceita.safeParse(lerFormData(entrada));
    if (!validacao.success) return erroDeValidacao(validacao.error);
    const { id } = validacao.data;

    const usuario = await clientePrisma.user.findUnique({
      where: { id: usuarioId },
      select: { role: true },
    });
    if (usuario?.role !== "ADMIN") {
      return falha("SEM_PERMISSAO", "Apenas administradores podem excluir receitas.");
    }

    const { count } = await clientePrisma.receita.deleteMany({
      where: { id, contaFamiliaId },
    });

    if (count === 0) return falha("NAO_ENCONTRADO", "Receita não encontrada.");

    revalidatePath(ROTA_ENTRADAS);
    return sucesso({ id });
  } catch (erro) {
    return tratarErro(erro);
  }
}
