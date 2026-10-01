import type { SituacaoDespesa } from "../model/tipos";

const estilos: Record<SituacaoDespesa, string> = {
  ABERTA: "bg-info-claro text-info",
  VENCIMENTO_PROXIMO: "bg-alerta-claro text-alerta",
  VENCIDA: "bg-perigo-claro text-perigo",
  PAGA: "bg-primaria-claro text-primaria",
};

const rotulo = (situacao: SituacaoDespesa, diasParaVencimento: number): string => {
  if (situacao === "PAGA") return "Paga";
  if (situacao === "VENCIDA") return "Vencida";
  if (situacao === "ABERTA") return "Aberta";
  if (diasParaVencimento === 0) return "Vence hoje";
  return diasParaVencimento === 1 ? "Vence em 1 dia" : `Vence em ${diasParaVencimento} dias`;
};

export default function SeloSituacao({
  situacao,
  diasParaVencimento,
}: {
  situacao: SituacaoDespesa;
  diasParaVencimento: number;
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${estilos[situacao]}`}
    >
      {rotulo(situacao, diasParaVencimento)}
    </span>
  );
}
