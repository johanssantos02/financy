import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";

import { contarFiltros, type FiltrosDespesa } from "@/src/entities/despesa";
import { listarTags } from "@/src/entities/despesa/server";
import { obterContextoUsuario } from "@/src/shared/lib/sessao";
import {
  BarraBuscaDespesas,
  EsqueletoListaDespesas,
  ListaDespesas,
} from "@/src/widgets/lista-despesas";

async function obterDadosIniciais(contaFamiliaId: string): Promise<{ tags: string[] }> {
  try {
    const tags = await listarTags(contaFamiliaId);
    return { tags };
  } catch {
    return { tags: [] };
  }
}

export default async function PaginaDespesas({ filtros }: { filtros: FiltrosDespesa }) {
  const contexto = await obterContextoUsuario();
  const contaFamiliaId = contexto.sucesso ? contexto.dados.contaFamiliaId : "";
  const { tags: tagsDisponiveis } = await obterDadosIniciais(contaFamiliaId);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-texto">Despesas</h1>
        <Link
          href="/despesas/nova"
          className="flex items-center gap-1.5 min-h-[44px] px-3 text-sm font-medium text-primaria hover:text-primaria-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria rounded-lg"
        >
          <Plus size={18} strokeWidth={1.75} />
          Nova despesa
        </Link>
      </div>
      <BarraBuscaDespesas
        filtros={filtros}
        totalFiltrosAplicados={contarFiltros(filtros)}
        tagsDisponiveis={tagsDisponiveis}
      />
      <Suspense key={JSON.stringify(filtros)} fallback={<EsqueletoListaDespesas />}>
        <ListaDespesas filtros={filtros} />
      </Suspense>
    </main>
  );
}
