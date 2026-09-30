import { EsqueletoListaDespesas } from "@/src/widgets/lista-despesas";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">
      <h1 className="text-xl font-semibold text-texto">Despesas</h1>
      <EsqueletoListaDespesas comBarra />
    </main>
  );
}
