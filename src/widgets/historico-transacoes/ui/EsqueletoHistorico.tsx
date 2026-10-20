export default function EsqueletoHistorico() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-borda bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-32 animate-pulse rounded bg-fundo-sec" />
              <div className="h-3 w-20 animate-pulse rounded bg-fundo-sec" />
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="h-4 w-16 animate-pulse rounded bg-fundo-sec" />
              <div className="h-5 w-14 animate-pulse rounded-full bg-fundo-sec" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
