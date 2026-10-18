import type { ResumoReceita } from "@/src/entities/receita";

import GerenciadorEntradas from "./GerenciadorEntradas";

type Props = {
  receitas: ResumoReceita[];
  papel: "USER" | "ADMIN";
};

export default function PaginaEntradas({ receitas, papel }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">
      <GerenciadorEntradas receitas={receitas} ehAdmin={papel === "ADMIN"} />
    </main>
  );
}
