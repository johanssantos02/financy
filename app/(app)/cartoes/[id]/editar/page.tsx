import { PaginaEditarCartao } from "@/src/pages/editar-cartao";

export const metadata = {
  title: "Editar cartão | Financy",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <PaginaEditarCartao id={id} />;
}
