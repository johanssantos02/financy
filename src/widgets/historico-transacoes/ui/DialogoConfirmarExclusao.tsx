"use client";

import { formatarValor } from "@/src/shared/lib/moeda";

type Props = {
  nome: string;
  valor: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  excluindo: boolean;
};

export default function DialogoConfirmarExclusao({
  nome,
  valor,
  onConfirmar,
  onCancelar,
  excluindo,
}: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-dialogo-exclusao"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-sm rounded-2xl border border-borda bg-card p-6 shadow-xl">
        <h2 id="titulo-dialogo-exclusao" className="text-base font-semibold text-texto">
          Excluir gasto
        </h2>
        <p className="mt-2 text-sm text-texto-sec">
          Deseja excluir{" "}
          <strong className="text-texto">&ldquo;{nome}&rdquo;</strong>{" "}
          ({formatarValor(valor)})? Esta ação não pode ser desfeita.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancelar}
            disabled={excluindo}
            className="flex-1 rounded-xl border border-borda bg-card py-2.5 text-sm font-medium text-texto transition-colors hover:bg-fundo-sec disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={excluindo}
            className="flex-1 rounded-xl bg-perigo py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {excluindo ? "Excluindo…" : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
