// Reexporta utilitários monetários de shared para que os consumidores existentes
// não precisem mudar os imports.
export { formatarValor, mascararValor, valorDaMascara } from "@/src/shared/lib/moeda";

export const formatarDiaMes = (data: string) => `${data.slice(8, 10)}/${data.slice(5, 7)}`;
