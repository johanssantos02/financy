"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Home, Wallet, Heart, Menu } from "lucide-react";
import type { ReactNode } from "react";
import BotaoAcao from "./BotaoAcao";
import MenuAcoes from "./MenuAcoes";
import SidebarMenu from "./SidebarMenu";
import { ModalCriarGasto } from "@/src/features/gastos";

type ItemNavegacao = {
  rotulo: string;
  rota: string;
  icone: ReactNode;
};

const itens: ItemNavegacao[] = [
  { rotulo: "Início", rota: "/", icone: <Home size={24} strokeWidth={1.75} /> },
  { rotulo: "Despesas", rota: "/despesas", icone: <Wallet size={24} strokeWidth={1.75} /> },
  { rotulo: "Lista de desejos", rota: "/lista-de-desejos", icone: <Heart size={24} strokeWidth={1.75} /> },
];

function estaAtivo(rota: string, pathname: string): boolean {
  if (rota === "/") return pathname === "/";
  return pathname.startsWith(rota);
}

export default function NavbarRodape() {
  const pathname = usePathname() ?? "";
  const [menuAberto, setMenuAberto] = useState(false);
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [modalGastoAberto, setModalGastoAberto] = useState(false);
  // Incrementado a cada abertura para forçar remontagem do modal com estado fresco.
  const [gastoOpenKey, setGastoOpenKey] = useState(0);
  const fecharSidebar = useCallback(() => setSidebarAberta(false), []);
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
          <MenuAcoes
            aberto={menuAberto}
            onFechar={fecharMenu}
            onNovoGasto={() => {
              setGastoOpenKey((k) => k + 1);
              setModalGastoAberto(true);
            }}
            ref={menuRef}
          />
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

        <button
          type="button"
          onClick={() => {
            fecharMenu();
            setSidebarAberta(true);
          }}
          aria-label="Mais opções"
          aria-expanded={sidebarAberta}
          className={`flex flex-1 items-center justify-center ${
            sidebarAberta ? "text-primaria" : "text-texto-sec"
          }`}
        >
          <Menu size={24} strokeWidth={1.75} />
        </button>
      </div>

      <SidebarMenu aberto={sidebarAberta} onFechar={fecharSidebar} />

      <ModalCriarGasto
        key={gastoOpenKey}
        aberto={modalGastoAberto}
        onFechar={() => setModalGastoAberto(false)}
      />
    </nav>
  );
}
