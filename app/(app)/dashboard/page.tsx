import { sair } from "@/src/features/autenticacao/acoes";
import { obterSessao } from "@/src/features/autenticacao/acoes";

export const metadata = {
  title: "Dashboard | Financy",
};

export default async function PaginaDashboard() {
  const sessao = await obterSessao();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 p-8">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <h1 className="mb-2 text-2xl font-bold text-zinc-100">Dashboard</h1>
        <p className="mb-6 text-zinc-400">
          Olá, {sessao?.user?.name ?? "usuário"}!
        </p>
        <form action={sair}>
          <button
            type="submit"
            className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-600"
          >
            Sair
          </button>
        </form>
      </div>
    </main>
  );
}
