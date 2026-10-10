// Remove espaços nas extremidades e converte para minúsculas pt-BR.
// Usada para comparação sem diferenciar maiúsculas/minúsculas e sem espaços extras.
export const normalizarNome = (nome: string): string =>
  nome.trim().toLocaleLowerCase("pt-BR");
