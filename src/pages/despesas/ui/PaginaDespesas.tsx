import { Suspense } from "react";

import { contarFiltros, type FiltrosDespesa } from "@/src/entities/despesa";
import { listarTags } from "@/src/entities/despesa/server";
import { obterContextoUsuario } from "@/src/shared/lib/sessao";
import {
  BarraBuscaDespesas,
  EsqueletoListaDespesas,
  ListaDespesas,
} from "@/src/widgets/lista-despesas";

// Falhas aqui não bloqueiam a tela: a lista exibe o erro padronizado.
async function obterTagsDisponiveis(): Promise<string[]> {
  const contexto = await obterContextoUsuario();
  if (!contexto.sucesso) return [];
  try {
    return await listarTags(contexto.dados.contaFamiliaId);
  } catch {
    return [];
  }
}

export default async function PaginaDespesas({ filtros }: { filtros: FiltrosDespesa }) {
  const tagsDisponiveis = await obterTagsDisponiveis();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">
      <h1 className="text-xl font-semibold text-texto">Despesas</h1>
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
