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

const opcoes: ItemAcao[] = [
  { rotulo: "Nova entrada", rota: "/entradas/nova", icone: <TrendingUp size={20} strokeWidth={1.75} /> },
  { rotulo: "Nova despesa", rota: "/despesas/nova", icone: <TrendingDown size={20} strokeWidth={1.75} /> },
  { rotulo: "Nova dívida", rota: "/dividas/nova", icone: <CreditCard size={20} strokeWidth={1.75} /> },
  { rotulo: "Novo desejo", rota: "/lista-de-desejos/novo", icone: <Heart size={20} strokeWidth={1.75} /> },
];

type Props = {
  aberto: boolean;
  onFechar: () => void;
};

const MenuAcoes = forwardRef<HTMLDivElement, Props>(({ aberto, onFechar }, ref) => {
  const router = useRouter();

  if (!aberto) return null;

  const handleSelect = (rota: string) => {
    onFechar();
    router.push(rota);
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
