"use client";

import { forwardRef } from "react";
import { Plus } from "lucide-react";

type Props = {
  aberto: boolean;
  onToggle: () => void;
};

const BotaoAcao = forwardRef<HTMLButtonElement, Props>(({ aberto, onToggle }, ref) => {
  return (
    <button
      ref={ref}
      onClick={onToggle}
      aria-label={aberto ? "Fechar menu de criação" : "Abrir menu de criação"}
      className="w-14 h-14 bg-primaria text-white rounded-full shadow-lg flex items-center justify-center"
    >
      <span
        style={{
          display: "inline-flex",
          transition: "transform 0.2s ease",
          transform: aberto ? "rotate(45deg)" : "rotate(0deg)",
        }}
      >
        <Plus size={24} strokeWidth={2} />
      </span>
    </button>
  );
});

BotaoAcao.displayName = "BotaoAcao";

export default BotaoAcao;
