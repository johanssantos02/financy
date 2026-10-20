"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

const DEBOUNCE_MS = 400;

type Props = { buscaAtual: string };

export default function BarraBuscaHistorico({ buscaAtual }: Props) {
  const [valor, setValor] = useState(buscaAtual);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValor(buscaAtual);
  }, [buscaAtual]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const navegar = (novoValor: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (novoValor) {
      params.set("busca", novoValor);
    } else {
      params.delete("busca");
    }
    params.delete("pagina");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novoValor = e.target.value;
    setValor(novoValor);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => navegar(novoValor), DEBOUNCE_MS);
  };

  const handleLimpar = () => {
    setValor("");
    if (timerRef.current) clearTimeout(timerRef.current);
    navegar("");
  };

  return (
    <div className="relative">
      <Search
        size={18}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-texto-sec"
      />
      <input
        type="text"
        value={valor}
        onChange={handleChange}
        placeholder="Buscar transações"
        aria-label="Buscar transações"
        className="h-11 w-full rounded-xl border border-borda bg-card pl-10 pr-10 text-texto placeholder:text-texto-off focus:outline-none focus:ring-2 focus:ring-primaria"
      />
      {valor && (
        <button
          type="button"
          onClick={handleLimpar}
          aria-label="Limpar busca"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-texto-sec transition-colors hover:text-texto"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
