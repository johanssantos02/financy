import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { ItemCartao } from "@/src/entities/cartao";
import { listarCartoes } from "@/src/entities/cartao/server";
import { BotaoExcluirCartao } from "@/src/features/cartoes";
import { tratarErro, type ErroAplicacao } from "@/src/shared/lib/resultado";
import { obterContextoUsuario } from "@/src/shared/lib/sessao";
import { NotificarErro } from "@/src/shared/ui/notificacoes";

export default async function PaginaCartoes() {
  const contexto = await obterContextoUsuario();
  if (!contexto.sucesso) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">
        <h1 className="text-xl font-semibold text-texto">Cartões</h1>
        <NotificarErro erro={contexto.erro} />
      </main>
    );
  }

  let cartoes: Awaited<ReturnType<typeof listarCartoes>> = [];
  let erroListagem: ErroAplicacao | null = null;

  try {
    cartoes = await listarCartoes(contexto.dados.contaFamiliaId);
  } catch (erro) {
    const falha = tratarErro(erro);
    erroListagem = falha.erro;
  }

  const ehAdmin = contexto.dados.papel === "ADMIN";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-texto">Cartões</h1>
        <Link
          href="/cartoes/novo"
          className="flex items-center gap-1.5 min-h-[44px] px-3 text-sm font-medium text-primaria hover:text-primaria-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria rounded-lg"
        >
          <Plus size={18} strokeWidth={1.75} />
          Novo cartão
        </Link>
      </div>

      {erroListagem && <NotificarErro erro={erroListagem} />}

      {!erroListagem && cartoes.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-texto-sec text-sm">Nenhum cartão cadastrado.</p>
          <Link
            href="/cartoes/novo"
            className="rounded-xl bg-primaria px-4 py-2.5 text-sm font-medium text-white hover:bg-primaria-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria"
          >
            Cadastrar primeiro cartão
          </Link>
        </div>
      )}

      {cartoes.length > 0 && (
        <ul className="grid gap-3 md:grid-cols-2">
          {cartoes.map((cartao) => (
            <li key={cartao.id}>
              <ItemCartao
                cartao={cartao}
                acoes={
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/cartoes/${cartao.id}/editar`}
                      aria-label={`Editar cartão ${cartao.nome}`}
                      className="flex items-center justify-center w-10 h-10 rounded-xl text-white/80 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <Pencil size={18} strokeWidth={1.75} />
                    </Link>
                    {ehAdmin && (
                      <BotaoExcluirCartao id={cartao.id} nome={cartao.nome} />
                    )}
                  </div>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
