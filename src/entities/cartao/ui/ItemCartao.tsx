import type { ReactNode } from "react";

import { formatarValor } from "@/src/shared/lib/moeda";

import type { ResumoCartao } from "../model/tipos";

type Props = {
  cartao: ResumoCartao;
  acoes?: ReactNode;
};

export default function ItemCartao({ cartao, acoes }: Props) {
  const porcentagem =
    Number(cartao.limite) > 0
      ? Math.min(100, (Number(cartao.limiteUsado) / Number(cartao.limite)) * 100)
      : 0;

  const fundoCabecalho = cartao.cor
    ? { background: `linear-gradient(135deg, ${cartao.cor} 0%, ${cartao.cor}bb 100%)` }
    : { background: "linear-gradient(135deg, var(--color-primaria) 0%, var(--color-info) 100%)" };

  return (
    <article className="rounded-2xl overflow-hidden border border-borda flex flex-col">
      {/* Cabeçalho colorido */}
      <div className="px-4 py-3 flex items-start justify-between gap-3" style={fundoCabecalho}>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs text-white/75 truncate">{cartao.instituicao}</span>
          <span className="text-base font-semibold text-white truncate">{cartao.nome}</span>
        </div>
        {acoes && <div className="flex items-center gap-1 shrink-0 -mr-1 -mt-1">{acoes}</div>}
      </div>

      {/* Corpo */}
      <div className="bg-card px-4 py-3 flex flex-col gap-3">

      {/* Barra de uso do limite */}
      <div className="flex flex-col gap-1">
        <div
          role="meter"
          aria-valuenow={Number(cartao.limiteUsado)}
          aria-valuemin={0}
          aria-valuemax={Number(cartao.limite)}
          aria-label="Limite usado"
          className="h-2 w-full rounded-full bg-fundo-sec overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-primaria transition-all"
            style={{ width: `${porcentagem}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-texto-sec">
          <span>Usado {formatarValor(cartao.limiteUsado)}</span>
          <span>Limite {formatarValor(cartao.limite)}</span>
        </div>
      </div>

      <div className="text-xs text-texto-sec">
        Fecha dia {cartao.diaFechamento} · Vence dia {cartao.diaVencimento}
      </div>

      </div>{/* fim do corpo */}
    </article>
  );
}
