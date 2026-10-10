const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// O valor chega como decimal serializado; Number só é usado na formatação da exibição.
export const formatarValor = (valor: string) => formatadorMoeda.format(Number(valor));

// Máscara de digitação em centavos: os dígitos entram pela direita (1 → R$ 0,01).
// Limitado a 12 dígitos para respeitar as 10 casas inteiras aceitas pelo schema.
const LIMITE_DIGITOS_VALOR = 12;

const centavosDigitados = (texto: string) =>
  texto.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, LIMITE_DIGITOS_VALOR);

export const mascararValor = (texto: string): string => {
  const centavos = centavosDigitados(texto);
  return centavos === "" ? "" : formatadorMoeda.format(Number(centavos) / 100);
};

// Converte o texto mascarado para o decimal esperado pelo schema ("R$ 1.234,56" → "1234.56").
export const valorDaMascara = (texto: string): string => {
  const centavos = centavosDigitados(texto);
  if (centavos === "") return "";
  const completo = centavos.padStart(3, "0");
  return `${completo.slice(0, -2)}.${completo.slice(-2)}`;
};
