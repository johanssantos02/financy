import Form from "next/form";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";

import {
  paraSearchParams,
  parametroPorSituacao,
  SITUACOES,
  type FiltrosDespesa,
  type SituacaoDespesa,
} from "@/src/entities/despesa";

const rotulosSituacao: Record<SituacaoDespesa, string> = {
  ABERTA: "Aberta",
  VENCIMENTO_PROXIMO: "Vencimento próximo",
  VENCIDA: "Vencida",
  PAGA: "Paga",
};

const classeOpcao = "flex items-center gap-2 text-sm text-texto";
const classeLegenda = "mb-2 text-xs font-semibold uppercase tracking-wide text-texto-sec";
const classeFoco = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria";

type Props = {
  filtros: FiltrosDespesa;
  totalFiltrosAplicados: number;
  tagsDisponiveis: string[];
};

export default function BarraBuscaDespesas({
  filtros,
  totalFiltrosAplicados,
  tagsDisponiveis,
}: Props) {
  const opcaoRecorrencia =
    filtros.recorrente === null ? "" : filtros.recorrente ? "sim" : "nao";

  return (
    <Form action="/despesas" className="flex items-start gap-2">
      <div className="relative flex-1">
        <Search
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-texto-sec"
          aria-hidden="true"
        />
        <input
          type="search"
          name="q"
          defaultValue={filtros.q ?? ""}
          placeholder="Buscar despesas"
          aria-label="Buscar despesas"
          className="h-11 w-full rounded-xl border border-borda bg-card pl-10 pr-3 text-texto placeholder:text-texto-off focus:outline-none focus:ring-2 focus:ring-primaria"
        />
      </div>

      <button
        type="submit"
        aria-label="Buscar"
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primaria text-white hover:bg-primaria-escuro ${classeFoco}`}
      >
        <Search size={18} aria-hidden="true" />
      </button>

      <div className="relative shrink-0">
        {/* A key fecha o painel após aplicar, pois a URL muda. */}
        <details key={paraSearchParams(filtros)} className="group">
          <summary
            aria-label="Filtros"
            className={`flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-borda bg-card text-texto group-open:border-primaria group-open:text-primaria [&::-webkit-details-marker]:hidden ${classeFoco}`}
          >
            <SlidersHorizontal size={18} aria-hidden="true" />
          </summary>

          <div className="absolute right-0 top-12 z-40 flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-4 rounded-xl border border-borda bg-card p-4 shadow-lg">
            <fieldset>
              <legend className={classeLegenda}>Mês</legend>
              <input
                type="month"
                name="mes"
                defaultValue={filtros.competencia}
                aria-label="Mês de referência"
                className="h-10 w-full rounded-lg border border-borda bg-card px-3 text-sm text-texto focus:outline-none focus:ring-2 focus:ring-primaria"
              />
            </fieldset>

            <fieldset>
              <legend className={classeLegenda}>Situação</legend>
              <div className="flex flex-col gap-2">
                {SITUACOES.map((situacao) => (
                  <label key={situacao} className={classeOpcao}>
                    <input
                      type="checkbox"
                      name="situacao"
                      value={parametroPorSituacao[situacao]}
                      defaultChecked={filtros.situacoes.includes(situacao)}
                      className="accent-primaria"
                    />
                    {rotulosSituacao[situacao]}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className={classeLegenda}>Tags</legend>
              {tagsDisponiveis.length === 0 ? (
                <p className="text-sm text-texto-sec">Nenhuma tag cadastrada</p>
              ) : (
                <div className="flex max-h-32 flex-col gap-2 overflow-y-auto">
                  {tagsDisponiveis.map((tag) => (
                    <label key={tag} className={classeOpcao}>
                      <input
                        type="checkbox"
                        name="tag"
                        value={tag}
                        defaultChecked={filtros.tags.includes(tag)}
                        className="accent-primaria"
                      />
                      {tag}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            <fieldset>
              <legend className={classeLegenda}>Recorrência</legend>
              <div className="flex flex-col gap-2">
                {[
                  { valor: "", rotulo: "Todas" },
                  { valor: "sim", rotulo: "Recorrentes" },
                  { valor: "nao", rotulo: "Não recorrentes" },
                ].map(({ valor, rotulo }) => (
                  <label key={rotulo} className={classeOpcao}>
                    <input
                      type="radio"
                      name="recorrente"
                      value={valor}
                      defaultChecked={opcaoRecorrencia === valor}
                      className="accent-primaria"
                    />
                    {rotulo}
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="submit"
              className={`h-10 rounded-lg bg-primaria text-sm font-medium text-white hover:bg-primaria-escuro ${classeFoco}`}
            >
              Aplicar filtros
            </button>
          </div>
        </details>

        {totalFiltrosAplicados > 0 && (
          <span className="pointer-events-none absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primaria px-1 text-xs font-semibold text-white">
            <span aria-hidden="true">{totalFiltrosAplicados}</span>
            <span className="sr-only">{totalFiltrosAplicados} filtros aplicados</span>
            <Link
              href={`/despesas${paraSearchParams(filtros, { semFiltros: true })}`}
              aria-label="Limpar filtros"
              className={`pointer-events-auto absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-texto text-white ${classeFoco}`}
            >
              <X size={10} strokeWidth={3} aria-hidden="true" />
            </Link>
          </span>
        )}
      </div>
    </Form>
  );
}
