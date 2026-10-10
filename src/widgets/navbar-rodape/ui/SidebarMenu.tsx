"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CreditCard, X } from "lucide-react";

type ItemSidebar = {
  rotulo: string;
  rota: string;
  icone: React.ReactNode;
};

const opcoes: ItemSidebar[] = [
  { rotulo: "Cartões", rota: "/cartoes", icone: <CreditCard size={20} strokeWidth={1.75} /> },
];

type Props = {
  aberto: boolean;
  onFechar: () => void;
};

export default function SidebarMenu({ aberto, onFechar }: Props) {
  useEffect(() => {
    if (!aberto) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [aberto, onFechar]);

  return (
    <div
      className={`fixed inset-0 z-[60] ${aberto ? "" : "pointer-events-none"}`}
      aria-hidden={!aberto}
    >
      <div
        onClick={onFechar}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          aberto ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Mais opções"
        className={`absolute top-0 right-0 h-full w-72 max-w-[80%] bg-card shadow-lg flex flex-col origin-top-right transition-transform duration-300 ease-out ${
          aberto ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-borda">
          <h2 className="text-texto text-lg font-semibold">Mais opções</h2>
          <button
            onClick={onFechar}
            aria-label="Fechar"
            className="flex items-center justify-center w-10 h-10 -mr-2 text-texto-sec"
          >
            <X size={22} strokeWidth={1.75} />
          </button>
        </div>

        <nav className="py-2">
          {opcoes.map((opcao) => (
            <Link
              key={opcao.rotulo}
              href={opcao.rota}
              onClick={onFechar}
              className="flex items-center gap-3 w-full px-4 text-texto text-sm font-medium min-h-[48px] hover:bg-fundo-sec transition-colors"
            >
              <span className="text-texto-sec">{opcao.icone}</span>
              <span>{opcao.rotulo}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </div>
  );
}
