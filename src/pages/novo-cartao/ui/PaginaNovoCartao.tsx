import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { FormularioCartao } from "@/src/features/cartoes";

export default function PaginaNovoCartao() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">
      <header className="flex items-center gap-3">
        <Link
          href="/cartoes"
          aria-label="Voltar"
          className="flex items-center justify-center w-10 h-10 rounded-xl text-texto-sec hover:bg-fundo-sec focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria"
        >
          <ChevronLeft size={22} strokeWidth={1.75} />
        </Link>
        <h1 className="text-xl font-semibold text-texto">Novo cartão</h1>
      </header>

      <p className="text-sm text-texto-sec">
        Cadastre um cartão de crédito da sua família. Não pedimos número nem CVV.
      </p>
      <p className="text-xs text-texto-sec">Campos marcados com * são obrigatórios.</p>

      <FormularioCartao modo="criar" />
    </main>
  );
}
