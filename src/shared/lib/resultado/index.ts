import { z } from "zod";

export type TipoErro =
  | "VALIDACAO"
  | "NAO_AUTENTICADO"
  | "SEM_PERMISSAO"
  | "NAO_ENCONTRADO"
  | "CONFLITO"
  | "ERRO_INTERNO";

const statusPorTipo = {
  VALIDACAO: 400,
  NAO_AUTENTICADO: 401,
  SEM_PERMISSAO: 403,
  NAO_ENCONTRADO: 404,
  CONFLITO: 409,
  ERRO_INTERNO: 500,
} as const satisfies Record<TipoErro, number>;

export type StatusErro = (typeof statusPorTipo)[TipoErro];

export type ErroAplicacao = {
  status: StatusErro;
  tipo: TipoErro;
  mensagem: string;
  campos?: Record<string, string[]>;
};

export type Resultado<T> =
  | { sucesso: true; dados: T }
  | { sucesso: false; erro: ErroAplicacao };

export type Falha = { sucesso: false; erro: ErroAplicacao };

export const sucesso = <T>(dados: T): Resultado<T> => ({ sucesso: true, dados });

export const falha = (
  tipo: TipoErro,
  mensagem: string,
  campos?: Record<string, string[]>
): Falha => ({
  sucesso: false,
  erro: { status: statusPorTipo[tipo], tipo, mensagem, ...(campos ? { campos } : {}) },
});

export const erroDeValidacao = (erro: z.ZodError): Falha => {
  const { fieldErrors } = z.flattenError(erro);
  const campos = Object.fromEntries(
    Object.entries(fieldErrors).filter(
      (entrada): entrada is [string, string[]] => Array.isArray(entrada[1])
    )
  );
  return falha("VALIDACAO", "Verifique os campos informados.", campos);
};

export const codigoErroPrisma = (erro: unknown): string | null =>
  typeof erro === "object" &&
  erro !== null &&
  "code" in erro &&
  typeof erro.code === "string"
    ? erro.code
    : null;

// Converte falhas inesperadas em um erro padronizado sem expor detalhes internos.
export const tratarErro = (erro: unknown): Falha => {
  const codigo = codigoErroPrisma(erro);
  if (codigo === "P2002") {
    return falha("CONFLITO", "Já existe um registro com estes dados.");
  }
  if (codigo === "P2025") {
    return falha("NAO_ENCONTRADO", "Registro não encontrado.");
  }
  console.error(erro);
  return falha("ERRO_INTERNO", "Algo deu errado. Tente novamente.");
};
