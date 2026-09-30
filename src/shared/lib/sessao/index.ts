import "server-only";

import { auth } from "@/auth";
import { clientePrisma } from "@/src/shared/api/prisma";
import { falha, sucesso, type Resultado } from "@/src/shared/lib/resultado";

export type ContextoUsuario = {
  usuarioId: string;
  papel: "USER" | "ADMIN";
  contaFamiliaId: string;
};

// A conta família vem sempre do servidor: a primeira em que o usuário ingressou.
export async function obterContextoUsuario(): Promise<Resultado<ContextoUsuario>> {
  const sessao = await auth();
  const usuarioId = sessao?.user?.id;
  if (!usuarioId) return falha("NAO_AUTENTICADO", "Faça login para continuar.");

  const membro = await clientePrisma.contaFamiliaMembro.findFirst({
    where: { usuarioId },
    orderBy: { entradoEm: "asc" },
    select: { contaFamiliaId: true },
  });
  if (!membro) {
    return falha("SEM_PERMISSAO", "Você não participa de uma conta família.");
  }

  return sucesso({
    usuarioId,
    papel: sessao.user.role,
    contaFamiliaId: membro.contaFamiliaId,
  });
}
