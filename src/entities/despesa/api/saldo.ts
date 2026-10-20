import "server-only";

import { clientePrisma } from "@/src/shared/api/prisma";
import {
  fimDaCompetencia,
  inicioDaCompetencia,
  paraDataBanco,
} from "@/src/shared/lib/datas";

export async function obterSaldoMes(contaFamiliaId: string, competencia: string): Promise<string> {
  const competenciaInicio = paraDataBanco(inicioDaCompetencia(competencia));
  const inicioPeriodo = competenciaInicio;
  const fimPeriodo = paraDataBanco(fimDaCompetencia(competencia));

  const [receitasAgregado, despesasPagas, gastosAgregado] = await Promise.all([
    clientePrisma.receita.aggregate({
      where: {
        contaFamiliaId,
        OR: [{ competencia: competenciaInicio }, { competencia: null }],
      },
      _sum: { valor: true },
    }),
    clientePrisma.despesa.aggregate({
      where: {
        contaFamiliaId,
        pagamentos: { some: { competencia: competenciaInicio } },
      },
      _sum: { valor: true },
    }),
    clientePrisma.gasto.aggregate({
      where: {
        contaFamiliaId,
        data: { gte: inicioPeriodo, lte: fimPeriodo },
        formaPagamento: "DINHEIRO",
      },
      _sum: { valor: true },
    }),
  ]);

  const totalReceitas = receitasAgregado._sum.valor?.toNumber() ?? 0;
  const totalPago = despesasPagas._sum.valor?.toNumber() ?? 0;
  const totalGastos = gastosAgregado._sum.valor?.toNumber() ?? 0;
  return (totalReceitas - totalPago - totalGastos).toFixed(2);
}
