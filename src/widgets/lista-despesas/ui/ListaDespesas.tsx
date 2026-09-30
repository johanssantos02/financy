import {
  ItemDespesa,
  type FiltrosDespesa,
  type GrupoSituacao,
  type ListagemDespesas,
} from "@/src/entities/despesa";
import { listarDespesas } from "@/src/entities/despesa/server";
import { inicioDaCompetencia, paraDataBanco } from "@/src/shared/lib/datas";
import { tratarErro, type Resultado } from "@/src/shared/lib/resultado";
import { obterContextoUsuario } from "@/src/shared/lib/sessao";
import { NotificarErro } from "@/src/shared/ui/notificacoes";

const titulos: Record<GrupoSituacao, string> = {
  VENCIDAS: "Vencidas",
  ABERTAS: "Abertas",
  PAGAS: "Pagas",
};

const formatadorMes = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const formatarCompetencia = (competencia: string) =>
  formatadorMes.format(paraDataBanco(inicioDaCompetencia(competencia)));

async function carregar(filtros: FiltrosDespesa): Promise<Resultado<ListagemDespesas>> {
  const contexto = await obterContextoUsuario();
  if (!contexto.sucesso) return contexto;
  try {
    return {
      sucesso: true,
      dados: await listarDespesas(contexto.dados.contaFamiliaId, filtros),
    };
  } catch (erro) {
    return tratarErro(erro);
  }
}

export default async function ListaDespesas({ filtros }: { filtros: FiltrosDespesa }) {
  const resultado = await carregar(filtros);

  if (!resultado.sucesso) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-perigo/30 bg-perigo-claro p-4 text-sm text-perigo"
      >
        {resultado.erro.mensagem}
        <NotificarErro erro={resultado.erro} />
      </div>
    );
  }

  const { competencia, grupos, totalFiltrosAplicados } = resultado.dados;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm capitalize text-texto-sec">{formatarCompetencia(competencia)}</p>

      {grupos.length === 0 ? (
        <div className="rounded-xl border border-borda bg-card p-6 text-center">
          <p className="font-medium text-texto">Nenhuma despesa encontrada</p>
          {totalFiltrosAplicados > 0 && (
            <p className="mt-1 text-sm text-texto-sec">Tente limpar os filtros.</p>
          )}
        </div>
      ) : (
        grupos.map(({ grupo, itens }) => (
          <section key={grupo} aria-labelledby={`grupo-${grupo}`} className="flex flex-col gap-3">
            <h2
              id={`grupo-${grupo}`}
              className={`flex items-center gap-2 text-sm font-semibold ${
                grupo === "VENCIDAS" ? "text-perigo" : "text-texto"
              }`}
            >
              {titulos[grupo]}
              <span className="text-xs font-normal text-texto-sec">({itens.length})</span>
            </h2>
            <ul className="flex flex-col gap-3">
              {itens.map((ocorrencia) => (
                <ItemDespesa key={ocorrencia.despesaId} ocorrencia={ocorrencia} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
