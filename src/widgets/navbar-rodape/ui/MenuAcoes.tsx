"use client";

import { forwardRef } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, CreditCard, Heart } from "lucide-react";
import type { ReactNode } from "react";

type ItemAcao = {
  rotulo: string;
  rota: string;
  icone: ReactNode;
};

const ROTA_NOVA_DESPESA = "/despesas/nova";

const opcoes: ItemAcao[] = [
  { rotulo: "Nova entrada", rota: "/entradas/nova", icone: <TrendingUp size={20} strokeWidth={1.75} /> },
  { rotulo: "Nova despesa", rota: ROTA_NOVA_DESPESA, icone: <TrendingDown size={20} strokeWidth={1.75} /> },
  { rotulo: "Novo gasto", rota: "/gastos/novo", icone: <CreditCard size={20} strokeWidth={1.75} /> },
  { rotulo: "Novo desejo", rota: "/lista-de-desejos/novo", icone: <Heart size={20} strokeWidth={1.75} /> },
];

type Props = {
  aberto: boolean;
  onFechar: () => void;
};

const MenuAcoes = forwardRef<HTMLDivElement, Props>(({ aberto, onFechar }, ref) => {
  const router = useRouter();

  if (!aberto) return null;

  // A tela de nova despesa usa a origem para voltar ao ponto de partida ao cancelar ou salvar.
  const comOrigem = (rota: string) => {
    const atual = window.location.pathname + window.location.search;
    if (rota !== ROTA_NOVA_DESPESA || window.location.pathname === ROTA_NOVA_DESPESA) return rota;
    return `${rota}?origem=${encodeURIComponent(atual)}`;
  };

  const handleSelect = (rota: string) => {
    onFechar();
    router.push(comOrigem(rota));
  };

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-card rounded-xl shadow-lg overflow-hidden w-48"
    >
      {opcoes.map((opcao) => (
        <button
          key={opcao.rota}
          onClick={() => handleSelect(opcao.rota)}
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
