"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Home, CreditCard, Heart, Settings } from "lucide-react";
import type { ReactNode } from "react";
import BotaoAcao from "./BotaoAcao";
import MenuAcoes from "./MenuAcoes";

type ItemNavegacao = {
  rotulo: string;
  rota: string;
  icone: ReactNode;
};

const itens: ItemNavegacao[] = [
  { rotulo: "Início", rota: "/", icone: <Home size={24} strokeWidth={1.75} /> },
  { rotulo: "Dívidas", rota: "/dividas", icone: <CreditCard size={24} strokeWidth={1.75} /> },
  { rotulo: "Lista de desejos", rota: "/lista-de-desejos", icone: <Heart size={24} strokeWidth={1.75} /> },
  { rotulo: "Configurações", rota: "/configuracoes", icone: <Settings size={24} strokeWidth={1.75} /> },
];

function estaAtivo(rota: string, pathname: string): boolean {
  if (rota === "/") return pathname === "/";
  return pathname.startsWith(rota);
}

export default function NavbarRodape() {
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuAberto) return;
    const handler = (e: PointerEvent) => {
      if (
        menuRef.current?.contains(e.target as Node) ||
        botaoRef.current?.contains(e.target as Node)
      )
        return;
      setMenuAberto(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [menuAberto]);

  const fecharMenu = () => setMenuAberto(false);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-borda w-full"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="h-16 flex">
        <Link
          href={itens[0].rota}
          onClick={fecharMenu}
          aria-label={itens[0].rotulo}
          className={`flex flex-1 items-center justify-center ${
            estaAtivo(itens[0].rota, pathname) ? "text-primaria" : "text-texto-sec"
          }`}
        >
          {itens[0].icone}
        </Link>

        <Link
          href={itens[1].rota}
          onClick={fecharMenu}
          aria-label={itens[1].rotulo}
          className={`flex flex-1 items-center justify-center ${
            estaAtivo(itens[1].rota, pathname) ? "text-primaria" : "text-texto-sec"
          }`}
        >
          {itens[1].icone}
        </Link>

        <div className="flex flex-1 items-center justify-center relative">
          <MenuAcoes aberto={menuAberto} onFechar={fecharMenu} ref={menuRef} />
          <BotaoAcao
            aberto={menuAberto}
            onToggle={() => setMenuAberto((v) => !v)}
            ref={botaoRef}
          />
        </div>

        <Link
          href={itens[2].rota}
          onClick={fecharMenu}
          aria-label={itens[2].rotulo}
          className={`flex flex-1 items-center justify-center ${
            estaAtivo(itens[2].rota, pathname) ? "text-primaria" : "text-texto-sec"
          }`}
        >
          {itens[2].icone}
        </Link>

        <Link
          href={itens[3].rota}
          onClick={fecharMenu}
          aria-label={itens[3].rotulo}
          className={`flex flex-1 items-center justify-center ${
            estaAtivo(itens[3].rota, pathname) ? "text-primaria" : "text-texto-sec"
          }`}
        >
          {itens[3].icone}
        </Link>
      </div>
    </nav>
  );
}
