"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard, Pencil, Receipt, Trash2 } from "lucide-react";

import type { TipoTransacao, TransacaoUnificada } from "@/src/entities/gasto";
import { excluirGasto } from "@/src/features/gastos";
import { formatarValor } from "@/src/shared/lib/moeda";
import { notificarResultado } from "@/src/shared/ui/notificacoes";

import DialogoConfirmarExclusao from "./DialogoConfirmarExclusao";

const ACTION_WIDTH = 160;
const THRESHOLD = 80;

const formatarData = (isoString: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(isoString));

const icone: Record<TipoTransacao, React.ReactNode> = {
  GASTO_DINHEIRO: <Banknote size={12} aria-hidden="true" />,
  GASTO_CARTAO: <CreditCard size={12} aria-hidden="true" />,
  DESPESA_PAGA: <Receipt size={12} aria-hidden="true" />,
};

const rotulo: Record<TipoTransacao, string> = {
  GASTO_DINHEIRO: "Dinheiro",
  GASTO_CARTAO: "Cartão",
  DESPESA_PAGA: "Despesa",
};

const badgeCor: Record<TipoTransacao, string> = {
  GASTO_DINHEIRO: "bg-info-claro text-info",
  GASTO_CARTAO: "bg-alerta-claro text-alerta",
  DESPESA_PAGA: "bg-primaria-claro text-primaria",
};

type Props = { transacao: TransacaoUnificada };

export default function ItemTransacao({ transacao }: Props) {
  const router = useRouter();
  const [offsetX, setOffsetX] = useState(0);
  const [estaArrastando, setEstaArrastando] = useState(false);
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [excluindo, startExcluindo] = useTransition();

  const startXRef = useRef(0);
  const baseOffsetRef = useRef(0);

  const ehEditavel = transacao.editavel;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ehEditavel) return;
    setEstaArrastando(true);
    startXRef.current = e.clientX;
    baseOffsetRef.current = offsetX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!estaArrastando || !ehEditavel) return;
    const deltaX = e.clientX - startXRef.current;
    const novoOffset = Math.max(-ACTION_WIDTH, Math.min(0, baseOffsetRef.current + deltaX));
    setOffsetX(novoOffset);
  };

  const handlePointerUp = () => {
    if (!estaArrastando) return;
    setEstaArrastando(false);
    const delta = offsetX - baseOffsetRef.current;
    if (Math.abs(delta) >= THRESHOLD) {
      if (delta < 0) {
        setOffsetX(-ACTION_WIDTH);
      } else {
        setOffsetX(0);
      }
    } else {
      setOffsetX(baseOffsetRef.current);
    }
  };

  const handlePointerCancel = () => {
    setEstaArrastando(false);
    setOffsetX(baseOffsetRef.current);
  };

  const handleEditar = () => {
    router.push(`/gastos/${transacao.id}/editar`);
  };

  const confirmarExclusao = () => {
    startExcluindo(async () => {
      const resultado = await excluirGasto({ id: transacao.id });
      notificarResultado(resultado, "Gasto excluído.");
      setDialogoAberto(false);
      setOffsetX(0);
    });
  };

  return (
    <>
      <li className="relative overflow-hidden rounded-xl">
        {ehEditavel && (
          <div
            className="absolute inset-y-0 right-0 flex"
            style={{ width: ACTION_WIDTH }}
            aria-hidden="true"
          >
            <button
              type="button"
              onClick={handleEditar}
              className="flex flex-1 flex-col items-center justify-center gap-1 bg-info text-white"
            >
              <Pencil size={18} aria-hidden="true" />
              <span className="text-xs font-medium">Editar</span>
            </button>
            <button
              type="button"
              onClick={() => setDialogoAberto(true)}
              disabled={excluindo}
              className="flex flex-1 flex-col items-center justify-center gap-1 bg-perigo text-white disabled:opacity-60"
            >
              <Trash2 size={18} aria-hidden="true" />
              <span className="text-xs font-medium">Excluir</span>
            </button>
          </div>
        )}

        <div
          className="relative z-10 flex items-center justify-between gap-3 rounded-xl border border-borda bg-card p-4"
          style={{
            transform: `translateX(${offsetX}px)`,
            transition: estaArrastando ? "none" : "transform 200ms ease",
            touchAction: ehEditavel ? "pan-y" : "auto",
            userSelect: "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-sm font-medium text-texto">{transacao.nome}</span>
            <span className="text-xs text-texto-sec">{formatarData(transacao.criadoEm)}</span>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-sm font-semibold text-texto">
              {formatarValor(transacao.valor)}
            </span>
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badgeCor[transacao.tipo]}`}
            >
              {icone[transacao.tipo]}
              {rotulo[transacao.tipo]}
            </span>
          </div>
        </div>
      </li>

      {dialogoAberto && (
        <DialogoConfirmarExclusao
          nome={transacao.nome}
          valor={transacao.valor}
          onConfirmar={confirmarExclusao}
          onCancelar={() => {
            setDialogoAberto(false);
            setOffsetX(0);
          }}
          excluindo={excluindo}
        />
      )}
    </>
  );
}
