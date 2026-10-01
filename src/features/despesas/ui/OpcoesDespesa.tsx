"use client";

import { useId, useRef, type MouseEvent, type ReactNode } from "react";
import { CircleCheck, Pencil, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

import { formatarValor } from "@/src/entities/despesa";

type Props = {
  nome: string;
  valor: string;
};

type Opcao = {
  rotulo: string;
  icone: ReactNode;
  corIcone: string;
  perigo?: boolean;
};

const opcoes: Opcao[] = [
  { rotulo: "Pagar", icone: <CircleCheck size={20} strokeWidth={1.75} />, corIcone: "text-primaria" },
  { rotulo: "Editar", icone: <Pencil size={20} strokeWidth={1.75} />, corIcone: "text-info" },
  {
    rotulo: "Excluir",
    icone: <Trash2 size={20} strokeWidth={1.75} />,
    corIcone: "text-perigo",
    perigo: true,
  },
];

// As opções ainda são apenas visuais; a lógica será ligada às Server Actions depois.
const MENSAGEM_EM_BREVE = "Em breve.";

export default function OpcoesDespesa({ nome, valor }: Props) {
  // <dialog> nativo com showModal já cuida do foco, da tecla Esc e do bloqueio do fundo.
  const dialogo = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  const abrir = () => dialogo.current?.showModal();
  const fechar = () => dialogo.current?.close();

  // O clique no backdrop chega com o próprio <dialog> como alvo.
  const fecharAoClicarFora = (evento: MouseEvent<HTMLDialogElement>) => {
    if (evento.target === evento.currentTarget) fechar();
  };

  const selecionar = () => {
    fechar();
    toast(MENSAGEM_EM_BREVE);
  };

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        aria-haspopup="dialog"
        aria-label={`Opções da despesa ${nome}`}
        className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria"
      />

      <dialog
        ref={dialogo}
        onClick={fecharAoClicarFora}
        aria-labelledby={idTitulo}
        className="mx-auto mb-0 mt-auto w-full max-w-none rounded-t-2xl bg-card p-0 text-texto shadow-lg backdrop:bg-black/40 md:my-auto md:max-w-sm md:rounded-2xl"
      >
        <div className="flex flex-col gap-4 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-4">
          <header className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <h2 id={idTitulo} className="truncate font-semibold">
                {nome}
              </h2>
              <span className="text-lg font-semibold tabular-nums">{formatarValor(valor)}</span>
            </div>
            <button
              type="button"
              onClick={fechar}
              aria-label="Fechar"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-texto-sec hover:bg-fundo-sec focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria"
            >
              <X size={20} strokeWidth={1.75} />
            </button>
          </header>

          <ul className="flex flex-col overflow-hidden rounded-xl border border-borda">
            {opcoes.map((opcao) => (
              <li key={opcao.rotulo} className="border-b border-borda last:border-b-0">
                <button
                  type="button"
                  onClick={selecionar}
                  className={`flex min-h-12 w-full items-center gap-3 px-4 text-sm font-medium transition-colors hover:bg-fundo-sec focus-visible:bg-fundo-sec focus-visible:outline-none ${
                    opcao.perigo ? "text-perigo" : "text-texto"
                  }`}
                >
                  <span className={opcao.corIcone}>{opcao.icone}</span>
                  {opcao.rotulo}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </>
  );
}
