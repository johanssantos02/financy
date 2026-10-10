"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { excluirCartao } from "../api/acoes";

type Props = {
  id: string;
  nome: string;
};

export default function BotaoExcluirCartao({ id, nome }: Props) {
  const [excluindo, iniciarExclusao] = useTransition();

  const handleClick = () => {
    if (!confirm(`Excluir o cartão "${nome}"? Esta ação não pode ser desfeita.`)) return;

    const dados = new FormData();
    dados.set("id", id);

    iniciarExclusao(async () => {
      const resultado = await excluirCartao(dados);
      if (resultado.sucesso) {
        toast.success("Cartão excluído.");
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
      aria-label={`Excluir cartão ${nome}`}
      className="flex items-center justify-center w-10 h-10 rounded-xl text-white/80 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Trash2 size={18} strokeWidth={1.75} />
    </button>
  );
}
