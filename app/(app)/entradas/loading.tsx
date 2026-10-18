export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 animate-pulse rounded-lg bg-fundo-sec" />
        <div className="h-9 w-32 animate-pulse rounded-lg bg-fundo-sec" />
      </div>
      <ul className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="animate-pulse rounded-xl border border-borda bg-card px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-24 rounded bg-fundo-sec" />
              <div className="h-5 w-14 rounded-full bg-fundo-sec" />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
