import { CreditCard, Nfc } from "lucide-react";

import { formatarValor } from "@/src/shared/lib/moeda";

type Props = {
  nome?: string;
  instituicao?: string;
  limite?: string;
  diaFechamento?: string;
  diaVencimento?: string;
  cor?: string | null;
};

export default function PreviaCartao({
  nome,
  instituicao,
  limite,
  diaFechamento,
  diaVencimento,
  cor,
}: Props) {
  const nomeExibido = nome?.trim() || "Nome do cartão";
  const instituicaoExibida = instituicao?.trim() || "Instituição";
  const limiteFormatado = limite ? formatarValor(limite) : "R$ 0,00";
  const fechamentoExibido = diaFechamento || "--";
  const vencimentoExibido = diaVencimento || "--";

  const fundo = cor
    ? `linear-gradient(135deg, ${cor} 0%, ${cor}bb 100%)`
    : "linear-gradient(135deg, var(--color-primaria) 0%, var(--color-info) 100%)";

  return (
    // aria-hidden porque os dados são reproduzidos pelos campos do formulário que vêm abaixo
    <div
      aria-hidden="true"
      className="relative w-full rounded-2xl p-5 text-white overflow-hidden"
      style={{
        background: fundo,
        minHeight: "180px",
      }}
    >
      {/* Cabeçalho do cartão */}
      <div className="flex items-start justify-between mb-6">
        <span className="text-sm font-medium opacity-90">{instituicaoExibida}</span>
        <Nfc size={22} strokeWidth={1.5} className="opacity-80" />
      </div>

      {/* Ícone e limite */}
      <div className="flex items-center gap-2 mb-4">
        <CreditCard size={28} strokeWidth={1.5} className="opacity-80" />
        <span className="text-xl font-bold tracking-wide">{limiteFormatado}</span>
      </div>

      {/* Nome */}
      <div className="text-base font-semibold truncate mb-3">{nomeExibido}</div>

      {/* Dias */}
      <div className="text-xs opacity-75">
        Fecha dia {fechamentoExibido} · Vence dia {vencimentoExibido}
      </div>
    </div>
  );
}
