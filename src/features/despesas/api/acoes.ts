"use server";

import { revalidatePath } from "next/cache";

import {
  competenciaPermitida,
  normalizarNome,
  schemaDespesa,
  schemaEditarDespesa,
  schemaIdDespesa,
  schemaPagamento,
  type DetalheDespesa,
} from "@/src/entities/despesa";
import {
  existeNomeDespesa,
  obterDespesaPorId,
  sincronizarTags,
} from "@/src/entities/despesa/server";
import { clientePrisma } from "@/src/shared/api/prisma";
import { inicioDaCompetencia, paraDataBanco } from "@/src/shared/lib/datas";
import {
  codigoErroPrisma,
  erroDeValidacao,
  falha,
  sucesso,
  tratarErro,
  type Resultado,
} from "@/src/shared/lib/resultado";
import { obterContextoUsuario } from "@/src/shared/lib/sessao";

type Entrada = FormData | Record<string, unknown>;

const ROTA_DESPESAS = "/despesas";
const MENSAGEM_NAO_ENCONTRADA = "Despesa não encontrada.";
const MENSAGEM_NOME_EM_USO = "Já existe uma despesa com este nome.";

// Aceita FormData para uso futuro com useActionState; campos vazios viram ausentes.
const lerEntrada = (entrada: Entrada): Record<string, unknown> => {
  if (!(entrada instanceof FormData)) return entrada;
  const dados: Record<string, unknown> = {};
  for (const chave of new Set(entrada.keys())) {
    if (chave.startsWith("$ACTION")) continue;
    const valores = entrada.getAll(chave).filter((v): v is string => typeof v === "string");
    if (chave === "tags") {
      dados.tags = valores.filter((v) => v.trim() !== "");
    } else if (valores[0] !== undefined && valores[0] !== "") {
      dados[chave] = valores[0];
    }
  }
  return dados;
};

export async function criarDespesa(entrada: Entrada): Promise<Resultado<{ id: string }>> {
  try {
    const contexto = await obterContextoUsuario();
    if (!contexto.sucesso) return contexto;
    const { usuarioId, contaFamiliaId } = contexto.dados;

    const validacao = schemaDespesa.safeParse(lerEntrada(entrada));
    if (!validacao.success) return erroDeValidacao(validacao.error);
    const dados = validacao.data;

    if (await existeNomeDespesa(contaFamiliaId, dados.nome)) {
      return falha("CONFLITO", MENSAGEM_NOME_EM_USO);
    }

    const despesa = await clientePrisma.$transaction(async (tx) => {
      const criada = await tx.despesa.create({
        data: {
          contaFamiliaId,
          criadoPorId: usuarioId,
          nome: dados.nome,
          nomeNormalizado: normalizarNome(dados.nome),
          valor: dados.valor,
          vencimento: paraDataBanco(dados.vencimento),
          lancamento: paraDataBanco(dados.lancamento),
          recorrente: dados.recorrente,
          descricao: dados.descricao,
        },
        select: { id: true },
      });
      await sincronizarTags(tx, contaFamiliaId, criada.id, dados.tags);
      return criada;
    });

    revalidatePath(ROTA_DESPESAS);
    return sucesso({ id: despesa.id });
  } catch (erro) {
    if (codigoErroPrisma(erro) === "P2002") return falha("CONFLITO", MENSAGEM_NOME_EM_USO);
    return tratarErro(erro);
  }
}

export async function editarDespesa(entrada: Entrada): Promise<Resultado<{ id: string }>> {
  try {
    const contexto = await obterContextoUsuario();
    if (!contexto.sucesso) return contexto;
    const { contaFamiliaId } = contexto.dados;

    const validacao = schemaEditarDespesa.safeParse(lerEntrada(entrada));
    if (!validacao.success) return erroDeValidacao(validacao.error);
    const { id, tags, ...dados } = validacao.data;

    if (!(await obterDespesaPorId(contaFamiliaId, id))) {
      return falha("NAO_ENCONTRADO", MENSAGEM_NAO_ENCONTRADA);
    }
    if (dados.nome !== undefined && (await existeNomeDespesa(contaFamiliaId, dados.nome, id))) {
      return falha("CONFLITO", MENSAGEM_NOME_EM_USO);
    }

    await clientePrisma.$transaction(async (tx) => {
      await tx.despesa.update({
        where: { id },
        data: {
          ...(dados.nome !== undefined
            ? { nome: dados.nome, nomeNormalizado: normalizarNome(dados.nome) }
            : {}),
          ...(dados.valor !== undefined ? { valor: dados.valor } : {}),
          ...(dados.vencimento !== undefined
            ? { vencimento: paraDataBanco(dados.vencimento) }
            : {}),
          ...(dados.lancamento !== undefined
            ? { lancamento: paraDataBanco(dados.lancamento) }
            : {}),
          ...(dados.recorrente !== undefined ? { recorrente: dados.recorrente } : {}),
          ...(dados.descricao !== undefined ? { descricao: dados.descricao } : {}),
        },
      });
      if (tags !== undefined) await sincronizarTags(tx, contaFamiliaId, id, tags);
    });

    revalidatePath(ROTA_DESPESAS);
    return sucesso({ id });
  } catch (erro) {
    if (codigoErroPrisma(erro) === "P2002") return falha("CONFLITO", MENSAGEM_NOME_EM_USO);
    return tratarErro(erro);
  }
}

export async function excluirDespesa(entrada: Entrada): Promise<Resultado<{ id: string }>> {
  try {
    const contexto = await obterContextoUsuario();
    if (!contexto.sucesso) return contexto;
    const { usuarioId, contaFamiliaId } = contexto.dados;

    const validacao = schemaIdDespesa.safeParse(lerEntrada(entrada));
    if (!validacao.success) return erroDeValidacao(validacao.error);
    const { id } = validacao.data;

    // O papel é relido do banco porque o token da sessão pode estar desatualizado.
    const usuario = await clientePrisma.user.findUnique({
      where: { id: usuarioId },
      select: { role: true },
    });
    if (usuario?.role !== "ADMIN") {
      return falha("SEM_PERMISSAO", "Apenas administradores podem excluir despesas.");
    }

    // Exclusão lógica: preserva pagamentos passados e libera o nome para reutilização.
    const { count } = await clientePrisma.despesa.updateMany({
      where: { id, contaFamiliaId, excluidoEm: null },
      data: { excluidoEm: new Date(), nomeNormalizado: null },
    });
    if (count === 0) return falha("NAO_ENCONTRADO", MENSAGEM_NAO_ENCONTRADA);

    revalidatePath(ROTA_DESPESAS);
    return sucesso({ id });
  } catch (erro) {
    return tratarErro(erro);
  }
}

type ResultadoPagamento = Resultado<{ id: string; competencia: string }>;

export async function marcarDespesaComoPaga(entrada: Entrada): Promise<ResultadoPagamento> {
  try {
    const contexto = await obterContextoUsuario();
    if (!contexto.sucesso) return contexto;
    const { usuarioId, contaFamiliaId } = contexto.dados;

    const validacao = schemaPagamento.safeParse(lerEntrada(entrada));
    if (!validacao.success) return erroDeValidacao(validacao.error);
    const { id, competencia } = validacao.data;

    const despesa = await obterDespesaPorId(contaFamiliaId, id, { incluirExcluidas: true });
    if (!despesa) return falha("NAO_ENCONTRADO", MENSAGEM_NAO_ENCONTRADA);
    if (!competenciaPermitida(despesa, competencia)) {
      return despesa.excluidoEm
        ? falha("NAO_ENCONTRADO", MENSAGEM_NAO_ENCONTRADA)
        : falha("VALIDACAO", "Esta despesa não existe neste mês.");
    }

    try {
      await clientePrisma.pagamentoDespesa.create({
        data: {
          despesaId: id,
          competencia: paraDataBanco(inicioDaCompetencia(competencia)),
          pagoPorId: usuarioId,
        },
      });
    } catch (erro) {
      // A unicidade (despesa, competência) garante um único pagamento mesmo em concorrência.
      if (codigoErroPrisma(erro) === "P2002") {
        return falha("CONFLITO", "Esta despesa já está paga neste mês.");
      }
      throw erro;
    }

    revalidatePath(ROTA_DESPESAS);
    return sucesso({ id, competencia });
  } catch (erro) {
    return tratarErro(erro);
  }
}

// Qualquer membro pode desmarcar, inclusive um pagamento registrado por outro usuário.
export async function desmarcarPagamentoDespesa(entrada: Entrada): Promise<ResultadoPagamento> {
  try {
    const contexto = await obterContextoUsuario();
    if (!contexto.sucesso) return contexto;
    const { contaFamiliaId } = contexto.dados;

    const validacao = schemaPagamento.safeParse(lerEntrada(entrada));
    if (!validacao.success) return erroDeValidacao(validacao.error);
    const { id, competencia } = validacao.data;

    const { count } = await clientePrisma.pagamentoDespesa.deleteMany({
      where: {
        despesaId: id,
        competencia: paraDataBanco(inicioDaCompetencia(competencia)),
        despesa: { contaFamiliaId },
      },
    });

    if (count === 0) {
      const despesa = await obterDespesaPorId(contaFamiliaId, id, { incluirExcluidas: true });
      return despesa
        ? falha("CONFLITO", "Esta despesa não está paga neste mês.")
        : falha("NAO_ENCONTRADO", MENSAGEM_NAO_ENCONTRADA);
    }

    revalidatePath(ROTA_DESPESAS);
    return sucesso({ id, competencia });
  } catch (erro) {
    return tratarErro(erro);
  }
}

export async function obterDespesa(entrada: Entrada): Promise<Resultado<DetalheDespesa>> {
  try {
    const contexto = await obterContextoUsuario();
    if (!contexto.sucesso) return contexto;

    const validacao = schemaIdDespesa.safeParse(lerEntrada(entrada));
    if (!validacao.success) return erroDeValidacao(validacao.error);

    const despesa = await obterDespesaPorId(contexto.dados.contaFamiliaId, validacao.data.id);
    if (!despesa) return falha("NAO_ENCONTRADO", MENSAGEM_NAO_ENCONTRADA);

    return sucesso({
      id: despesa.id,
      nome: despesa.nome,
      valor: despesa.valor,
      vencimento: despesa.vencimento,
      lancamento: despesa.lancamento,
      recorrente: despesa.recorrente,
      descricao: despesa.descricao,
      tags: despesa.tags,
    });
  } catch (erro) {
    return tratarErro(erro);
  }
}
