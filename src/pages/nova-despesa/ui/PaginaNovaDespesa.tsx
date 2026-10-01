import { FormularioNovaDespesa } from "@/src/features/despesas";

export default function PaginaNovaDespesa({ origem }: { origem: string | null }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-texto">Nova despesa</h1>
        <p className="text-sm text-texto-sec">
          Cadastre uma conta a pagar da sua família. Despesas recorrentes se repetem todo mês a
          partir do vencimento.
        </p>
      </header>
      <p className="text-xs text-texto-sec">Campos marcados com * são obrigatórios.</p>
      <FormularioNovaDespesa origem={origem} />
    </main>
  );
}
