"use client";

import { forwardRef } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, CreditCard, Heart } from "lucide-react";
import type { ReactNode } from "react";

type ItemAcao = {
  rotulo: string;
  icone: ReactNode;
  acao: () => void;
};

const ROTA_NOVA_DESPESA = "/despesas/nova";

type Props = {
  aberto: boolean;
  onFechar: () => void;
  onNovoGasto: () => void;
};

const MenuAcoes = forwardRef<HTMLDivElement, Props>(({ aberto, onFechar, onNovoGasto }, ref) => {
  const router = useRouter();

  if (!aberto) return null;

  // A tela de nova despesa usa a origem para voltar ao ponto de partida ao cancelar ou salvar.
  const comOrigem = (rota: string) => {
    const atual = window.location.pathname + window.location.search;
    if (rota !== ROTA_NOVA_DESPESA || window.location.pathname === ROTA_NOVA_DESPESA) return rota;
    return `${rota}?origem=${encodeURIComponent(atual)}`;
  };

  const navegar = (rota: string) => {
    onFechar();
    router.push(comOrigem(rota));
  };

  const opcoes: ItemAcao[] = [
    {
      rotulo: "Nova entrada",
      icone: <TrendingUp size={20} strokeWidth={1.75} />,
      acao: () => navegar("/entradas"),
    },
    {
      rotulo: "Nova despesa",
      icone: <TrendingDown size={20} strokeWidth={1.75} />,
      acao: () => navegar(ROTA_NOVA_DESPESA),
    },
    {
      rotulo: "Novo gasto",
      icone: <CreditCard size={20} strokeWidth={1.75} />,
      acao: () => {
        onFechar();
        onNovoGasto();
      },
    },
    {
      rotulo: "Novo desejo",
      icone: <Heart size={20} strokeWidth={1.75} />,
      acao: () => navegar("/lista-de-desejos/novo"),
    },
  ];

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-card rounded-xl shadow-lg overflow-hidden w-48"
    >
      {opcoes.map((opcao) => (
        <button
          key={opcao.rotulo}
          onClick={opcao.acao}
          className="flex items-center gap-3 w-full px-4 text-texto text-sm font-medium min-h-[48px] hover:bg-fundo-sec transition-colors"
        >
          <span className="text-texto-sec">{opcao.icone}</span>
          <span>{opcao.rotulo}</span>
        </button>
      ))}
    </div>
  );
});

MenuAcoes.displayName = "MenuAcoes";

export default MenuAcoes;
