import { Repeat } from "lucide-react";

import type { OcorrenciaDespesa } from "../model/tipos";
import SeloSituacao from "./SeloSituacao";

const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// O valor chega como decimal serializado; Number só é usado na formatação da exibição.
const formatarValor = (valor: string) => formatadorMoeda.format(Number(valor));

const formatarDiaMes = (data: string) => `${data.slice(8, 10)}/${data.slice(5, 7)}`;

export default function ItemDespesa({ ocorrencia }: { ocorrencia: OcorrenciaDespesa }) {
  const vencida = ocorrencia.situacao === "VENCIDA";
  const paga = ocorrencia.situacao === "PAGA";

  return (
    <li
      className={`flex flex-col gap-2 rounded-xl border bg-card p-4 ${
        vencida ? "border-perigo/30" : "border-borda"
      } ${paga ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={`truncate font-medium ${vencida ? "text-perigo" : "text-texto"}`}>
            {ocorrencia.nome}
          </span>
          {ocorrencia.recorrente && (
            <Repeat
              size={14}
              strokeWidth={2}
              className="shrink-0 text-texto-sec"
              role="img"
              aria-label="Recorrente"
            />
          )}
        </div>
        <span
          className={`shrink-0 font-semibold tabular-nums ${vencida ? "text-perigo" : "text-texto"}`}
        >
          {formatarValor(ocorrencia.valor)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <span className={vencida ? "text-perigo" : "text-texto-sec"}>
          Vence em {formatarDiaMes(ocorrencia.vencimento)}
        </span>
        <SeloSituacao
          situacao={ocorrencia.situacao}
          diasParaVencimento={ocorrencia.diasParaVencimento}
        />
      </div>

      {ocorrencia.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
          {ocorrencia.tags.map((tag) => (
            <li key={tag} className="rounded-md bg-fundo-sec px-2 text-xs text-texto-sec">
              {tag}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
