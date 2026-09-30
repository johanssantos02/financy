const Bloco = ({ className }: { className: string }) => (
  <div className={`animate-pulse rounded bg-fundo-sec ${className}`} />
);

const CartaoFantasma = () => (
  <li className="flex flex-col gap-3 rounded-xl border border-borda bg-card p-4">
    <div className="flex justify-between gap-3">
      <Bloco className="h-4 w-2/5" />
      <Bloco className="h-4 w-20" />
    </div>
    <div className="flex justify-between gap-3">
      <Bloco className="h-3 w-24" />
      <Bloco className="h-4 w-16 rounded-full" />
    </div>
  </li>
);

export default function EsqueletoListaDespesas({ comBarra = false }: { comBarra?: boolean }) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <span className="sr-only">Carregando despesas</span>
      {comBarra && (
        <div className="flex gap-2">
          <Bloco className="h-11 flex-1 rounded-xl" />
          <Bloco className="h-11 w-11 rounded-xl" />
          <Bloco className="h-11 w-11 rounded-xl" />
        </div>
      )}
      <Bloco className="h-4 w-32" />
      {[2, 3].map((quantidade, indice) => (
        <section key={indice} className="flex flex-col gap-3">
          <Bloco className="h-5 w-24" />
          <ul className="flex flex-col gap-3">
            {Array.from({ length: quantidade }, (_, i) => (
              <CartaoFantasma key={i} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
