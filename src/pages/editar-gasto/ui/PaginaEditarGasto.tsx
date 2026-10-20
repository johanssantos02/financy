import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { clientePrisma } from "@/src/shared/api/prisma";
import { deDataBanco } from "@/src/shared/lib/datas";
import { formatarValor } from "@/src/shared/lib/moeda";
import { obterContextoUsuario } from "@/src/shared/lib/sessao";
import { NotificarErro } from "@/src/shared/ui/notificacoes";

type Props = { id: string };

export default async function PaginaEditarGasto({ id }: Props) {
  const contexto = await obterContextoUsuario();
  if (!contexto.sucesso) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">
        <div
          role="alert"
          className="rounded-xl border border-perigo/30 bg-perigo-claro p-4 text-sm text-perigo"
        >
          {contexto.erro.mensagem}
          <NotificarErro erro={contexto.erro} />
        </div>
      </main>
    );
  }

  const { contaFamiliaId } = contexto.dados;

  const gasto = await clientePrisma.gasto.findFirst({
    where: { id, contaFamiliaId, formaPagamento: "DINHEIRO" },
    select: { id: true, nome: true, valor: true, data: true },
  });

  if (!gasto) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">
        <Link
          href="/dashboard"
          className="flex w-fit items-center gap-1 text-sm text-texto-sec hover:text-texto"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar
        </Link>
        <div
          role="alert"
          className="rounded-xl border border-perigo/30 bg-perigo-claro p-4 text-sm text-perigo"
        >
          Gasto não encontrado.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">
      <Link
        href="/dashboard"
        className="flex w-fit items-center gap-1 text-sm text-texto-sec hover:text-texto"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar
      </Link>
      <h1 className="text-xl font-semibold text-texto">Editar Gasto</h1>
      <div className="rounded-2xl border border-borda bg-card p-5">
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-texto-sec">Nome</dt>
            <dd className="font-medium text-texto">{gasto.nome}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-texto-sec">Valor</dt>
            <dd className="font-medium text-texto">{formatarValor(gasto.valor.toFixed(2))}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-texto-sec">Data</dt>
            <dd className="font-medium text-texto">{deDataBanco(gasto.data)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-texto-sec">A edição completa estará disponível em breve.</p>
      </div>
    </main>
  );
}
