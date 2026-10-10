export default function EsqueletoCartoes() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 animate-pulse rounded-lg bg-fundo-sec" />
        <div className="h-9 w-28 animate-pulse rounded-lg bg-fundo-sec" />
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="animate-pulse rounded-2xl border border-borda bg-card p-4">
            <div className="mb-3 h-5 w-32 rounded bg-fundo-sec" />
            <div className="mb-2 h-4 w-24 rounded bg-fundo-sec" />
            <div className="h-2 w-full rounded-full bg-fundo-sec" />
            <div className="mt-3 flex justify-between">
              <div className="h-4 w-20 rounded bg-fundo-sec" />
              <div className="h-4 w-20 rounded bg-fundo-sec" />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
