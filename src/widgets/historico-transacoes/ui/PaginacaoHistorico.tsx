"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  paginaAtual: number;
  totalPaginas: number;
};

export default function PaginacaoHistorico({ paginaAtual, totalPaginas }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildUrl = (pagina: number) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("pagina", String(pagina));
    return `${pathname}?${params.toString()}`;
  };

  const classeLink = "flex items-center gap-1 text-sm font-medium text-primaria transition-colors hover:text-primaria-escuro";
  const classeDesabilitado = "flex items-center gap-1 text-sm font-medium text-texto-off cursor-not-allowed";

  return (
    <div className="flex items-center justify-between py-1">
      {paginaAtual > 1 ? (
        <Link href={buildUrl(paginaAtual - 1)} className={classeLink} aria-label="Página anterior">
          <ChevronLeft size={16} aria-hidden="true" />
          Anterior
        </Link>
      ) : (
        <span className={classeDesabilitado} aria-disabled="true">
          <ChevronLeft size={16} aria-hidden="true" />
          Anterior
        </span>
      )}

      <span className="text-sm text-texto-sec">
        {paginaAtual} / {totalPaginas}
      </span>

      {paginaAtual < totalPaginas ? (
        <Link href={buildUrl(paginaAtual + 1)} className={classeLink} aria-label="Próxima página">
          Próxima
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      ) : (
        <span className={classeDesabilitado} aria-disabled="true">
          Próxima
          <ChevronRight size={16} aria-hidden="true" />
        </span>
      )}
    </div>
  );
}
