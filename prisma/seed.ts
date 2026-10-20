import { PrismaClient } from "../src/shared/api/prisma/gerado/client";

const prisma = new PrismaClient();

const TAGS_GASTOS = [
  { nome: "Lazer", nomeNormalizado: "lazer" },
  { nome: "Gasolina", nomeNormalizado: "gasolina" },
  { nome: "Saúde", nomeNormalizado: "saude" },
  { nome: "Alimentação", nomeNormalizado: "alimentacao" },
  { nome: "Outros", nomeNormalizado: "outros" },
];

async function main() {
  const contas = await prisma.contaFamilia.findMany({ select: { id: true } });

  for (const conta of contas) {
    for (const tag of TAGS_GASTOS) {
      await prisma.tag.upsert({
        where: {
          contaFamiliaId_nomeNormalizado_tipo: {
            contaFamiliaId: conta.id,
            nomeNormalizado: tag.nomeNormalizado,
            tipo: "GASTOS",
          },
        },
        update: {},
        create: {
          contaFamiliaId: conta.id,
          nome: tag.nome,
          nomeNormalizado: tag.nomeNormalizado,
          tipo: "GASTOS",
        },
      });
    }
  }

  console.log(`Seed concluído: ${TAGS_GASTOS.length} tags GASTOS para ${contas.length} conta(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
