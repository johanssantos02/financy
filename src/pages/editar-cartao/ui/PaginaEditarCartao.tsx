import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { FormularioCartao } from "@/src/features/cartoes";
import { obterCartaoPorId } from "@/src/entities/cartao/server";
import { obterContextoUsuario } from "@/src/shared/lib/sessao";
import { NotificarErro } from "@/src/shared/ui/notificacoes";

type Props = {
  id: string;
};

export default async function PaginaEditarCartao({ id }: Props) {
  const contexto = await obterContextoUsuario();
  if (!contexto.sucesso) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">
        <h1 className="text-xl font-semibold text-texto">Editar cartão</h1>
        <NotificarErro erro={contexto.erro} />
      </main>
    );
  }

  const cartao = await obterCartaoPorId(contexto.dados.contaFamiliaId, id);
  if (!cartao) notFound();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/cartoes"
          aria-label="Voltar para cartões"
          className="flex items-center justify-center w-10 h-10 -ml-2 rounded-xl text-texto-sec hover:bg-fundo-sec focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria"
        >
          <ArrowLeft size={20} strokeWidth={1.75} />
        </Link>
        <h1 className="text-xl font-semibold text-texto">Editar cartão</h1>
      </div>

      <FormularioCartao modo="editar" cartao={cartao} />
    </main>
  );
}
