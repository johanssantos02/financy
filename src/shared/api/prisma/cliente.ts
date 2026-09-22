import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./gerado/client";

const criarClientePrisma = () => {
  const urlBanco = process.env.DATABASE_URL;

  if (!urlBanco) {
    throw new Error("A variável de ambiente DATABASE_URL não foi definida.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: urlBanco }),
  });
};

const escopoGlobal = globalThis as typeof globalThis & {
  clientePrisma?: ReturnType<typeof criarClientePrisma>;
};

export const clientePrisma =
  escopoGlobal.clientePrisma ?? criarClientePrisma();

if (process.env.NODE_ENV !== "production") {
  escopoGlobal.clientePrisma = clientePrisma;
}
