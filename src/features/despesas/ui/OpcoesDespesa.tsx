"use client";

import { useId, useRef, useState, useTransition, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleX, Pencil, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

import { formatarValor, type OcorrenciaDespesa } from "@/src/entities/despesa";

import { desmarcarPagamentoDespesa, excluirDespesa, marcarDespesaComoPaga } from "../api/acoes";

type Vista = "opcoes" | "pagar" | "confirmar-exclusao";

type Props = {
  ocorrencia: OcorrenciaDespesa;
  ehAdmin: boolean;
  saldoMes: string;
};

export default function OpcoesDespesa({ ocorrencia, ehAdmin, saldoMes }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();
  const router = useRouter();
  const [vista, setVista] = useState<Vista>("opcoes");
  const [enviando, iniciarEnvio] = useTransition();

  const ehPaga = ocorrencia.pagamento !== null;

  const abrir = () => {
    setVista("opcoes");
    dialogo.current?.showModal();
  };

  const fechar = () => dialogo.current?.close();

  const fecharAoClicarFora = (evento: MouseEvent<HTMLDialogElement>) => {
    if (evento.target === evento.currentTarget) fechar();
  };

  const confirmarPagamento = () => {
    iniciarEnvio(async () => {
      const dados = new FormData();
      dados.set("id", ocorrencia.despesaId);
      dados.set("competencia", ocorrencia.competencia);
      const acao = ehPaga ? desmarcarPagamentoDespesa : marcarDespesaComoPaga;
      const resultado = await acao(dados);
      if (resultado.sucesso) {
        toast.success(ehPaga ? "Pagamento desmarcado." : "Despesa marcada como paga.");
        fechar();
      } else {
        toast.error(resultado.erro.mensagem);
      }
    });
  };

  const confirmarExclusao = () => {
    iniciarEnvio(async () => {
      const dados = new FormData();
      dados.set("id", ocorrencia.despesaId);
      const resultado = await excluirDespesa(dados);
      if (resultado.sucesso) {
        toast.success("Despesa excluída.");
        fechar();
      } else {
        toast.error(resultado.erro.mensagem);
      }
    });
  };

  const classeBotaoSecundario =
    "flex h-11 flex-1 items-center justify-center rounded-xl border border-borda bg-card text-sm font-medium text-texto hover:bg-fundo-sec focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        aria-haspopup="dialog"
        aria-label={`Opções da despesa ${ocorrencia.nome}`}
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
                {ocorrencia.nome}
              </h2>
              <span className="text-lg font-semibold tabular-nums">
                {formatarValor(ocorrencia.valor)}
              </span>
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

          {vista === "opcoes" && (
            <ul className="flex flex-col overflow-hidden rounded-xl border border-borda">
              <li className="border-b border-borda">
                <button
                  type="button"
                  onClick={() => setVista("pagar")}
                  className="flex min-h-12 w-full items-center gap-3 px-4 text-sm font-medium text-texto transition-colors hover:bg-fundo-sec focus-visible:bg-fundo-sec focus-visible:outline-none"
                >
                  <span className={ehPaga ? "text-texto-sec" : "text-primaria"}>
                    {ehPaga ? (
                      <CircleX size={20} strokeWidth={1.75} />
                    ) : (
                      <CircleCheck size={20} strokeWidth={1.75} />
                    )}
                  </span>
                  {ehPaga ? "Desmarcar pagamento" : "Pagar"}
                </button>
              </li>
              <li className={ehAdmin ? "border-b border-borda" : ""}>
                <button
                  type="button"
                  onClick={() => {
                    fechar();
                    router.push(`/despesas/${ocorrencia.despesaId}/editar`);
                  }}
                  className="flex min-h-12 w-full items-center gap-3 px-4 text-sm font-medium text-texto transition-colors hover:bg-fundo-sec focus-visible:bg-fundo-sec focus-visible:outline-none"
                >
                  <span className="text-info">
                    <Pencil size={20} strokeWidth={1.75} />
                  </span>
                  Editar
                </button>
              </li>
              {ehAdmin && (
                <li>
                  <button
                    type="button"
                    onClick={() => setVista("confirmar-exclusao")}
                    className="flex min-h-12 w-full items-center gap-3 px-4 text-sm font-medium text-perigo transition-colors hover:bg-fundo-sec focus-visible:bg-fundo-sec focus-visible:outline-none"
                  >
                    <span className="text-perigo">
                      <Trash2 size={20} strokeWidth={1.75} />
                    </span>
                    Excluir
                  </button>
                </li>
              )}
            </ul>
          )}

          {vista === "pagar" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 rounded-xl border border-borda bg-fundo-sec p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-texto-sec">Competência</span>
                  <span className="font-medium text-texto">
                    {formatarCompetencia(ocorrencia.competencia)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-texto-sec">Saldo disponível</span>
                  <span
                    className={`font-semibold tabular-nums ${
                      Number(saldoMes) >= 0 ? "text-primaria" : "text-perigo"
                    }`}
                  >
                    {formatarValor(saldoMes)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setVista("opcoes")}
                  disabled={enviando}
                  className={classeBotaoSecundario}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={confirmarPagamento}
                  disabled={enviando}
                  className={`flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                    ehPaga
                      ? "bg-texto-sec hover:opacity-80"
                      : "bg-primaria hover:bg-primaria-escuro"
                  }`}
                >
                  {enviando ? "Aguarde…" : ehPaga ? "Desmarcar" : "Confirmar pagamento"}
                </button>
              </div>
            </div>
          )}

          {vista === "confirmar-exclusao" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-texto-sec">
                Tem certeza que deseja excluir{" "}
                <strong className="text-texto">{ocorrencia.nome}</strong>? Esta ação não pode ser
                desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setVista("opcoes")}
                  disabled={enviando}
                  className={classeBotaoSecundario}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarExclusao}
                  disabled={enviando}
                  className="flex h-11 flex-1 items-center justify-center rounded-xl bg-perigo text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-perigo focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enviando ? "Excluindo…" : "Excluir"}
                </button>
              </div>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}

function formatarCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split("-");
  return `${mes}/${ano}`;
}
