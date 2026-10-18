import { PaginaEntradas } from "@/src/pages/entradas";
import { listarReceitas } from "@/src/entities/receita/server";
import { tratarErro, type ErroAplicacao } from "@/src/shared/lib/resultado";
import { obterContextoUsuario } from "@/src/shared/lib/sessao";
import { NotificarErro } from "@/src/shared/ui/notificacoes";

export const metadata = {
  title: "Entradas | Financy",
};

export default async function Page() {
  const contexto = await obterContextoUsuario();
  if (!contexto.sucesso) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">
        <h1 className="text-xl font-semibold text-texto">Entradas</h1>
        <NotificarErro erro={contexto.erro} />
      </main>
    );
  }

  let receitas: Awaited<ReturnType<typeof listarReceitas>> = [];
  let erroListagem: ErroAplicacao | null = null;

  try {
    receitas = await listarReceitas(contexto.dados.contaFamiliaId);
  } catch (erro) {
    const falha = tratarErro(erro);
    erroListagem = falha.erro;
  }

  if (erroListagem) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">
        <h1 className="text-xl font-semibold text-texto">Entradas</h1>
        <NotificarErro erro={erroListagem} />
      </main>
    );
  }

  return <PaginaEntradas receitas={receitas} papel={contexto.dados.papel} />;
}
