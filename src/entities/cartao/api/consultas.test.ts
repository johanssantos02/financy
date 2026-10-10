import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/shared/api/prisma", () => ({
  clientePrisma: {
    cartaoCredito: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/src/shared/lib/texto", () => ({
  normalizarNome: vi.fn((nome: string) => nome.toLowerCase().trim()),
}));

import { clientePrisma } from "@/src/shared/api/prisma";
import { listarCartoes, obterCartaoPorId, existeNomeCartao } from "./consultas";

const cartaoRaw = {
  id: "uuid-1",
  nome: "Nubank",
  instituicao: "Nu Pagamentos",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  limite: { toFixed: (_n: number) => "5000.00" },
  diaFechamento: 3,
  diaVencimento: 10,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listarCartoes", () => {
  it("filtra por contaFamiliaId e ordena por nome asc", async () => {
    vi.mocked(clientePrisma.cartaoCredito.findMany).mockResolvedValue([cartaoRaw] as never);

    await listarCartoes("familia-456");

    expect(clientePrisma.cartaoCredito.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { contaFamiliaId: "familia-456" },
        orderBy: { nome: "asc" },
      })
    );
  });

  it("mapeia limiteUsado como 0.00", async () => {
    vi.mocked(clientePrisma.cartaoCredito.findMany).mockResolvedValue([cartaoRaw] as never);

    const result = await listarCartoes("familia-456");

    expect(result[0].limiteUsado).toBe("0.00");
  });

  it("mapeia limite via toFixed(2)", async () => {
    vi.mocked(clientePrisma.cartaoCredito.findMany).mockResolvedValue([cartaoRaw] as never);

    const result = await listarCartoes("familia-456");

    expect(result[0].limite).toBe("5000.00");
  });
});

describe("obterCartaoPorId", () => {
  it("busca com where contendo id e contaFamiliaId", async () => {
    vi.mocked(clientePrisma.cartaoCredito.findFirst).mockResolvedValue(cartaoRaw as never);

    await obterCartaoPorId("familia-456", "uuid-1");

    expect(clientePrisma.cartaoCredito.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "uuid-1", contaFamiliaId: "familia-456" },
      })
    );
  });

  it("retorna null quando cartão não encontrado", async () => {
    vi.mocked(clientePrisma.cartaoCredito.findFirst).mockResolvedValue(null);

    const result = await obterCartaoPorId("familia-456", "uuid-inexistente");

    expect(result).toBeNull();
  });

  it("retorna DetalheCartao com limite formatado", async () => {
    vi.mocked(clientePrisma.cartaoCredito.findFirst).mockResolvedValue(cartaoRaw as never);

    const result = await obterCartaoPorId("familia-456", "uuid-1");

    expect(result).toEqual({
      id: "uuid-1",
      nome: "Nubank",
      instituicao: "Nu Pagamentos",
      limite: "5000.00",
      diaFechamento: 3,
      diaVencimento: 10,
    });
  });
});

describe("existeNomeCartao", () => {
  it("normaliza o nome antes de buscar", async () => {
    vi.mocked(clientePrisma.cartaoCredito.findFirst).mockResolvedValue(null);

    await existeNomeCartao("familia-456", "Nubank");

    expect(clientePrisma.cartaoCredito.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          nomeNormalizado: "nubank",
        }),
      })
    );
  });

  it("retorna false quando nome não existe", async () => {
    vi.mocked(clientePrisma.cartaoCredito.findFirst).mockResolvedValue(null);

    const result = await existeNomeCartao("familia-456", "Nubank");

    expect(result).toBe(false);
  });

  it("retorna true quando nome já existe", async () => {
    vi.mocked(clientePrisma.cartaoCredito.findFirst).mockResolvedValue({ id: "uuid-1" } as never);

    const result = await existeNomeCartao("familia-456", "Nubank");

    expect(result).toBe(true);
  });

  it("inclui id: { not: ignorarId } quando ignorarId é fornecido", async () => {
    vi.mocked(clientePrisma.cartaoCredito.findFirst).mockResolvedValue(null);

    await existeNomeCartao("familia-456", "Nubank", "uuid-excluir");

    expect(clientePrisma.cartaoCredito.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { not: "uuid-excluir" },
        }),
      })
    );
  });
});
