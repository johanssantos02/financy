import "server-only";

import { clientePrisma } from "@/src/shared/api/prisma";

import type { ResumoTag } from "../model/tipos";

export async function listarTagsPorTipo(
  contaFamiliaId: string,
  tipo: "GASTOS" | "DESPESAS"
): Promise<ResumoTag[]> {
  const tags = await clientePrisma.tag.findMany({
    where: { contaFamiliaId, tipo },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });
  return tags;
}
