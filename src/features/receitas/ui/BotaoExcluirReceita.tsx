"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { excluirReceita } from "../api/acoes";

type Props = {
  id: string;
  descricao: string | null;
  valor: string;
};

export default function BotaoExcluirReceita({ id, descricao, valor }: Props) {
  const [excluindo, iniciarExclusao] = useTransition();
  const identificacao = descricao ?? valor;

  const handleClick = () => {
    if (!confirm(`Excluir esta entrada (${identificacao})? Esta ação não pode ser desfeita.`)) return;

    const dados = new FormData();
    dados.set("id", id);

    iniciarExclusao(async () => {
      const resultado = await excluirReceita(dados);
      if (resultado.sucesso) {
        toast.success("Receita excluída.");
      } else {
        toast.error(resultado.erro.mensagem);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={excluindo}
      aria-label={`Excluir receita ${identificacao}`}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-perigo hover:bg-perigo/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-perigo disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Trash2 size={18} strokeWidth={1.75} />
    </button>
  );
}
