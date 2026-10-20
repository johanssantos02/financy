import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { FormularioNovaDespesa } from "@/src/features/despesas";
import { obterDespesaPorId } from "@/src/entities/despesa/server";
import { obterContextoUsuario } from "@/src/shared/lib/sessao";
import { NotificarErro } from "@/src/shared/ui/notificacoes";

type Props = {
  id: string;
};

export default async function PaginaEditarDespesa({ id }: Props) {
  const contexto = await obterContextoUsuario();
  if (!contexto.sucesso) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">
        <h1 className="text-xl font-semibold text-texto">Editar despesa</h1>
        <NotificarErro erro={contexto.erro} />
      </main>
    );
  }

  const despesa = await obterDespesaPorId(contexto.dados.contaFamiliaId, id);
  if (!despesa) notFound();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/despesas"
          aria-label="Voltar para despesas"
          className="flex h-10 w-10 -ml-2 items-center justify-center rounded-xl text-texto-sec hover:bg-fundo-sec focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria"
        >
          <ArrowLeft size={20} strokeWidth={1.75} />
        </Link>
        <h1 className="text-xl font-semibold text-texto">Editar despesa</h1>
      </div>

      <FormularioNovaDespesa modo="editar" despesa={despesa} />
    </main>
  );
}
