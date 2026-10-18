"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";

import { type DetalheReceita, type ResumoReceita } from "@/src/entities/receita";
import { BotaoExcluirReceita, ModalReceita } from "@/src/features/receitas";
import { formatarValor } from "@/src/shared/lib/moeda";

type Props = {
  receitas: ResumoReceita[];
  ehAdmin: boolean;
};

export default function GerenciadorEntradas({ receitas, ehAdmin }: Props) {
  const [modalAberto, setModalAberto] = useState(false);
  const [receitaEmEdicao, setReceitaEmEdicao] = useState<DetalheReceita | null>(null);
  // Incrementado em cada abertura para forçar reinicialização do estado do modal.
  const [openKey, setOpenKey] = useState(0);

  const abrirCriacao = () => {
    setReceitaEmEdicao(null);
    setOpenKey((k) => k + 1);
    setModalAberto(true);
  };

  const abrirEdicao = (receita: ResumoReceita) => {
    setReceitaEmEdicao(receita);
    setOpenKey((k) => k + 1);
    setModalAberto(true);
  };

  const fecharModal = () => setModalAberto(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-texto">Entradas</h1>
        <button
          type="button"
          onClick={abrirCriacao}
          className="flex items-center gap-1.5 min-h-[44px] px-3 text-sm font-medium text-primaria hover:text-primaria-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria rounded-lg"
        >
          <Plus size={18} strokeWidth={1.75} />
          Nova entrada
        </button>
      </div>

      {receitas.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-texto-sec text-sm">Nenhuma entrada cadastrada.</p>
          <button
            type="button"
            onClick={abrirCriacao}
            className="rounded-xl bg-primaria px-4 py-2.5 text-sm font-medium text-white hover:bg-primaria-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria"
          >
            Adicionar primeira entrada
          </button>
        </div>
      )}

      {receitas.length > 0 && (
        <ul className="flex flex-col gap-2">
          {receitas.map((receita) => (
            <li
              key={receita.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-borda bg-card px-4 py-3"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold tabular-nums">
                    {formatarValor(receita.valor)}
                  </span>
                  <span className="rounded-full bg-fundo-sec px-2 py-0.5 text-xs font-medium text-texto-sec">
                    {receita.tipo === "SALARIO" ? "Salário" : "Outro"}
                  </span>
                  {receita.competencia && (
                    <span className="text-xs text-texto-sec">
                      {formatarCompetencia(receita.competencia)}
                    </span>
                  )}
                </div>
                {receita.descricao && (
                  <span className="truncate text-sm text-texto-sec">{receita.descricao}</span>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => abrirEdicao(receita)}
                  aria-label={`Editar receita ${receita.descricao ?? formatarValor(receita.valor)}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-texto-sec hover:bg-fundo-sec focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria"
                >
                  <Pencil size={18} strokeWidth={1.75} />
                </button>
                {ehAdmin && (
                  <BotaoExcluirReceita
                    id={receita.id}
                    descricao={receita.descricao}
                    valor={formatarValor(receita.valor)}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ModalReceita
        key={openKey}
        modo={receitaEmEdicao ? "editar" : "criar"}
        receita={receitaEmEdicao ?? undefined}
        aberto={modalAberto}
        onFechar={fecharModal}
      />
    </>
  );
}

function formatarCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split("-");
  return `${mes}/${ano}`;
}
