import { PaginaNovaDespesa } from "@/src/pages/nova-despesa";
import { obterCaminhoInterno } from "@/src/shared/lib/formulario";

const ROTA_NOVA_DESPESA = "/despesas/nova";

export const metadata = {
  title: "Nova despesa | Financy",
};

export default async function Page({ searchParams }: PageProps<"/despesas/nova">) {
  const caminho = obterCaminhoInterno((await searchParams).origem);
  const origem = caminho?.startsWith(ROTA_NOVA_DESPESA) ? null : caminho;
  return <PaginaNovaDespesa origem={origem} />;
}
