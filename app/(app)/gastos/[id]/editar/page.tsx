import { PaginaEditarGasto } from "@/src/pages/editar-gasto";

export const metadata = {
  title: "Editar gasto | Financy",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <PaginaEditarGasto id={id} />;
}
