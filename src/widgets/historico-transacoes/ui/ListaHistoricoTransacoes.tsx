import type { FiltrosHistorico } from "@/src/entities/gasto";
import {
  contarTransacoesUnificadas,
  listarTransacoesUnificadas,
} from "@/src/entities/gasto/server";
import { NotificarErro } from "@/src/shared/ui/notificacoes";
import { tratarErro } from "@/src/shared/lib/resultado";

import ItemTransacao from "./ItemTransacao";
import PaginacaoHistorico from "./PaginacaoHistorico";

type Props = {
  contaFamiliaId: string;
  filtros: FiltrosHistorico;
};

export default async function ListaHistoricoTransacoes({ contaFamiliaId, filtros }: Props) {
  let transacoes: Awaited<ReturnType<typeof listarTransacoesUnificadas>>;
  let totalItens: number;

  try {
    [transacoes, totalItens] = await Promise.all([
      listarTransacoesUnificadas(contaFamiliaId, filtros),
      contarTransacoesUnificadas(contaFamiliaId, filtros),
    ]);
  } catch (erro) {
    const falha = tratarErro(erro);
    return (
      <div
        role="alert"
        className="rounded-xl border border-perigo/30 bg-perigo-claro p-4 text-sm text-perigo"
      >
        {falha.erro.mensagem}
        <NotificarErro erro={falha.erro} />
      </div>
    );
  }

  const totalPaginas = Math.ceil(totalItens / filtros.limite);

  if (transacoes.length === 0) {
    return (
      <div className="rounded-xl border border-borda bg-card p-8 text-center">
        <p className="font-medium text-texto">
          {filtros.busca
            ? `Nenhuma transação encontrada para "${filtros.busca}"`
            : "Nenhuma transação registrada"}
        </p>
        {!filtros.busca && (
          <p className="mt-1 text-sm text-texto-sec">
            Registre seu primeiro gasto para começar.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2" aria-label="Histórico de transações">
        {transacoes.map((transacao) => (
          <ItemTransacao key={transacao.id} transacao={transacao} />
        ))}
      </ul>
      {totalPaginas > 1 && (
        <PaginacaoHistorico paginaAtual={filtros.pagina} totalPaginas={totalPaginas} />
      )}
    </div>
  );
}
