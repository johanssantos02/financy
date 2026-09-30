import { normalizarFiltros } from "@/src/entities/despesa";
import { PaginaDespesas } from "@/src/pages/despesas";

export const metadata = {
  title: "Despesas | Financy",
};

export default async function Page({ searchParams }: PageProps<"/despesas">) {
  const filtros = normalizarFiltros(await searchParams);
  return <PaginaDespesas filtros={filtros} />;
}
