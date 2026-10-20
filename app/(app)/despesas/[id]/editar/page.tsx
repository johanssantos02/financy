import { PaginaEditarDespesa } from "@/src/pages/editar-despesa";

export const metadata = {
  title: "Editar despesa | Financy",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <PaginaEditarDespesa id={id} />;
}
