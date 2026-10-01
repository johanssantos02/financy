import { z } from "zod";

export type EntradaFormulario = FormData | Record<string, unknown>;

// Usada no cliente e no servidor para que a validação veja os mesmos dados; campos vazios viram ausentes.
export const lerFormData = (entrada: EntradaFormulario): Record<string, unknown> => {
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

// Aceita apenas caminhos do próprio app, evitando redirecionamento para outros domínios.
export const schemaCaminhoInterno = z
  .string()
  .max(500)
  .refine((valor) => valor.startsWith("/") && !valor.startsWith("//") && !valor.includes("\\"));

export const obterCaminhoInterno = (valor: unknown): string | null => {
  const resultado = schemaCaminhoInterno.safeParse(valor);
  return resultado.success ? resultado.data : null;
};
