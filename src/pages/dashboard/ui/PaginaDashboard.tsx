import { Suspense } from "react";

import { schemaFiltrosHistorico } from "@/src/entities/gasto";
import { obterSaldoMes } from "@/src/entities/despesa/server";
import { competenciaAtual, inicioDaCompetencia, paraDataBanco } from "@/src/shared/lib/datas";
import { formatarValor } from "@/src/shared/lib/moeda";
import { obterContextoUsuario } from "@/src/shared/lib/sessao";
import { NotificarErro } from "@/src/shared/ui/notificacoes";
import {
  BarraBuscaHistorico,
  EsqueletoHistorico,
  ListaHistoricoTransacoes,
} from "@/src/widgets/historico-transacoes";

const formatadorMes = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function PaginaDashboard({ searchParams }: Props) {
  const parseResult = schemaFiltrosHistorico.safeParse({
    busca: typeof searchParams.busca === "string" ? searchParams.busca : "",
    pagina: typeof searchParams.pagina === "string" ? searchParams.pagina : "1",
  });
  const filtros = parseResult.success ? parseResult.data : { busca: "", pagina: 1, limite: 20 };

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
  const competencia = competenciaAtual();
  const saldo = await obterSaldoMes(contaFamiliaId, competencia);
  const saldoNumerico = parseFloat(saldo);

  const mesFormatado = formatadorMes.format(
    paraDataBanco(inicioDaCompetencia(competencia))
  );

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">
      <h1 className="text-xl font-semibold text-texto">Dashboard</h1>

      <div className="rounded-2xl border border-borda bg-card p-5">
        <p className="text-xs capitalize text-texto-sec">{mesFormatado}</p>
        <p
          className={`mt-1 text-3xl font-bold tracking-tight ${
            saldoNumerico > 0
              ? "text-primaria"
              : saldoNumerico < 0
                ? "text-perigo"
                : "text-texto"
          }`}
        >
          {formatarValor(saldo)}
        </p>
        <p className="mt-1 text-xs text-texto-sec">Saldo disponível</p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-texto">Histórico</h2>
        <Suspense
          fallback={
            <div className="h-11 w-full animate-pulse rounded-xl border border-borda bg-fundo-sec" />
          }
        >
          <BarraBuscaHistorico buscaAtual={filtros.busca} />
        </Suspense>
        <Suspense key={JSON.stringify(filtros)} fallback={<EsqueletoHistorico />}>
          <ListaHistoricoTransacoes contaFamiliaId={contaFamiliaId} filtros={filtros} />
        </Suspense>
      </div>
    </main>
  );
}
