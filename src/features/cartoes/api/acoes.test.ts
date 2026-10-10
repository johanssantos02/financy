import { beforeEach, describe, expect, it, vi } from "vitest";

// Mocks devem ser declarados antes dos imports que os usam
vi.mock("@/src/shared/lib/sessao", () => ({
  obterContextoUsuario: vi.fn(),
}));

vi.mock("@/src/shared/api/prisma", () => ({
  clientePrisma: {
    cartaoCredito: {
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/src/entities/cartao/server", () => ({
  existeNomeCartao: vi.fn(),
  obterCartaoPorId: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { clientePrisma } from "@/src/shared/api/prisma";
import { obterContextoUsuario } from "@/src/shared/lib/sessao";
import { existeNomeCartao, obterCartaoPorId } from "@/src/entities/cartao/server";
import { revalidatePath } from "next/cache";
import { criarCartao, editarCartao, excluirCartao } from "./acoes";

const contextoMock = {
  sucesso: true as const,
  dados: {
    usuarioId: "user-123",
    papel: "USER" as const,
    contaFamiliaId: "familia-456",
  },
};

const entradaValida = {
  nome: "Nubank",
  instituicao: "Nu Pagamentos",
  limite: "5000.00",
  diaFechamento: "3",
  diaVencimento: "10",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("criarCartao", () => {
  it("retorna NAO_AUTENTICADO sem sessão", async () => {
    vi.mocked(obterContextoUsuario).mockResolvedValue({
      sucesso: false,
      erro: { status: 401, tipo: "NAO_AUTENTICADO", mensagem: "Faça login para continuar." },
    });

    const resultado = await criarCartao(entradaValida);
    expect(resultado.sucesso).toBe(false);
    if (!resultado.sucesso) {
      expect(resultado.erro.tipo).toBe("NAO_AUTENTICADO");
    }
    expect(clientePrisma.cartaoCredito.create).not.toHaveBeenCalled();
  });

  it("retorna SEM_PERMISSAO sem conta família", async () => {
    vi.mocked(obterContextoUsuario).mockResolvedValue({
      sucesso: false,
      erro: { status: 403, tipo: "SEM_PERMISSAO", mensagem: "Você não participa de uma conta família." },
    });

    const resultado = await criarCartao(entradaValida);
    expect(resultado.sucesso).toBe(false);
    if (!resultado.sucesso) {
      expect(resultado.erro.tipo).toBe("SEM_PERMISSAO");
    }
  });

  it("cria cartão com contaFamiliaId da sessão, ignorando qualquer outro enviado", async () => {
    vi.mocked(obterContextoUsuario).mockResolvedValue(contextoMock);
    vi.mocked(existeNomeCartao).mockResolvedValue(false);
    vi.mocked(clientePrisma.cartaoCredito.create).mockResolvedValue({ id: "cartao-789" } as never);

    // Envia um contaFamiliaId diferente — deve ser ignorado
    const resultado = await criarCartao({
      ...entradaValida,
      contaFamiliaId: "familia-atacante",
    });

    expect(resultado.sucesso).toBe(true);
    expect(clientePrisma.cartaoCredito.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contaFamiliaId: "familia-456", // da sessão, não da entrada
          nomeNormalizado: "nubank",
          diaFechamento: 3,
          diaVencimento: 10,
        }),
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/cartoes");
  });

  it("retorna CONFLITO quando nome já existe", async () => {
    vi.mocked(obterContextoUsuario).mockResolvedValue(contextoMock);
    vi.mocked(existeNomeCartao).mockResolvedValue(true);

    const resultado = await criarCartao(entradaValida);
    expect(resultado.sucesso).toBe(false);
    if (!resultado.sucesso) {
      expect(resultado.erro.tipo).toBe("CONFLITO");
    }
    expect(clientePrisma.cartaoCredito.create).not.toHaveBeenCalled();
  });

  it("retorna VALIDACAO com campos quando entrada é inválida", async () => {
    vi.mocked(obterContextoUsuario).mockResolvedValue(contextoMock);

    const resultado = await criarCartao({ nome: "", instituicao: "", limite: "0", diaFechamento: "0", diaVencimento: "32" });
    expect(resultado.sucesso).toBe(false);
    if (!resultado.sucesso) {
      expect(resultado.erro.tipo).toBe("VALIDACAO");
      expect(resultado.erro.campos).toBeDefined();
    }
    expect(clientePrisma.cartaoCredito.create).not.toHaveBeenCalled();
  });

  it("retorna CONFLITO quando Prisma lança P2002", async () => {
    vi.mocked(obterContextoUsuario).mockResolvedValue(contextoMock);
    vi.mocked(existeNomeCartao).mockResolvedValue(false);
    vi.mocked(clientePrisma.cartaoCredito.create).mockRejectedValue({ code: "P2002" });

    const resultado = await criarCartao(entradaValida);
    expect(resultado.sucesso).toBe(false);
    if (!resultado.sucesso) {
      expect(resultado.erro.tipo).toBe("CONFLITO");
    }
  });

  it("retorna ERRO_INTERNO para erro genérico", async () => {
    vi.mocked(obterContextoUsuario).mockResolvedValue(contextoMock);
    vi.mocked(existeNomeCartao).mockResolvedValue(false);
    vi.mocked(clientePrisma.cartaoCredito.create).mockRejectedValue(new Error("DB down"));

    const resultado = await criarCartao(entradaValida);
    expect(resultado.sucesso).toBe(false);
    if (!resultado.sucesso) {
      expect(resultado.erro.tipo).toBe("ERRO_INTERNO");
    }
  });
});

describe("editarCartao", () => {
  const entradaEdicao = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    ...entradaValida,
  };

  it("retorna VALIDACAO para id inválido", async () => {
    vi.mocked(obterContextoUsuario).mockResolvedValue(contextoMock);

    const resultado = await editarCartao({ ...entradaValida, id: "nao-e-uuid" });
    expect(resultado.sucesso).toBe(false);
    if (!resultado.sucesso) expect(resultado.erro.tipo).toBe("VALIDACAO");
  });

  it("retorna NAO_ENCONTRADO quando cartão não existe ou é de outra família", async () => {
    vi.mocked(obterContextoUsuario).mockResolvedValue(contextoMock);
    vi.mocked(obterCartaoPorId).mockResolvedValue(null);

    const resultado = await editarCartao(entradaEdicao);
    expect(resultado.sucesso).toBe(false);
    if (!resultado.sucesso) {
      expect(resultado.erro.tipo).toBe("NAO_ENCONTRADO");
      expect(resultado.erro.mensagem).toBe("Cartão não encontrado.");
    }
    expect(clientePrisma.cartaoCredito.updateMany).not.toHaveBeenCalled();
  });

  it("retorna CONFLITO quando nome já está em uso por outro cartão", async () => {
    vi.mocked(obterContextoUsuario).mockResolvedValue(contextoMock);
    vi.mocked(obterCartaoPorId).mockResolvedValue({
      id: entradaEdicao.id,
      nome: "Antigo",
      instituicao: "Nu Pagamentos",
      limite: "5000.00",
      diaFechamento: 3,
      diaVencimento: 10,
      cor: null,
    });
    vi.mocked(existeNomeCartao).mockResolvedValue(true);

    const resultado = await editarCartao(entradaEdicao);
    expect(resultado.sucesso).toBe(false);
    if (!resultado.sucesso) expect(resultado.erro.tipo).toBe("CONFLITO");
  });

  it("atualiza com contaFamiliaId da sessão no where", async () => {
    vi.mocked(obterContextoUsuario).mockResolvedValue(contextoMock);
    vi.mocked(obterCartaoPorId).mockResolvedValue({
      id: entradaEdicao.id,
      nome: "Nubank",
      instituicao: "Nu Pagamentos",
      limite: "5000.00",
      diaFechamento: 3,
      diaVencimento: 10,
      cor: null,
    });
    vi.mocked(existeNomeCartao).mockResolvedValue(false);
    vi.mocked(clientePrisma.cartaoCredito.updateMany).mockResolvedValue({ count: 1 });

    const resultado = await editarCartao(entradaEdicao);
    expect(resultado.sucesso).toBe(true);
    expect(clientePrisma.cartaoCredito.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: entradaEdicao.id, contaFamiliaId: "familia-456" },
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/cartoes");
  });

  it("retorna NAO_ENCONTRADO quando updateMany count é 0", async () => {
    vi.mocked(obterContextoUsuario).mockResolvedValue(contextoMock);
    vi.mocked(obterCartaoPorId).mockResolvedValue({
      id: entradaEdicao.id,
      nome: "Nubank",
      instituicao: "Nu Pagamentos",
      limite: "5000.00",
      diaFechamento: 3,
      diaVencimento: 10,
      cor: null,
    });
    vi.mocked(existeNomeCartao).mockResolvedValue(false);
    vi.mocked(clientePrisma.cartaoCredito.updateMany).mockResolvedValue({ count: 0 });

    const resultado = await editarCartao(entradaEdicao);
    expect(resultado.sucesso).toBe(false);
    if (!resultado.sucesso) expect(resultado.erro.tipo).toBe("NAO_ENCONTRADO");
  });
});

describe("excluirCartao", () => {
  it("retorna SEM_PERMISSAO para usuário não admin", async () => {
    vi.mocked(obterContextoUsuario).mockResolvedValue(contextoMock); // papel: USER
    vi.mocked(clientePrisma.user.findUnique).mockResolvedValue({ role: "USER" } as never);

    const resultado = await excluirCartao({ id: "550e8400-e29b-41d4-a716-446655440000" });
    expect(resultado.sucesso).toBe(false);
    if (!resultado.sucesso) {
      expect(resultado.erro.tipo).toBe("SEM_PERMISSAO");
      expect(resultado.erro.mensagem).toBe("Apenas administradores podem excluir cartões.");
    }
    expect(clientePrisma.cartaoCredito.deleteMany).not.toHaveBeenCalled();
  });

  it("exclui com contaFamiliaId da sessão no where para admin", async () => {
    vi.mocked(obterContextoUsuario).mockResolvedValue({
      ...contextoMock,
      dados: { ...contextoMock.dados, papel: "ADMIN" as const },
    });
    vi.mocked(clientePrisma.user.findUnique).mockResolvedValue({ role: "ADMIN" } as never);
    vi.mocked(clientePrisma.cartaoCredito.deleteMany).mockResolvedValue({ count: 1 });

    const resultado = await excluirCartao({ id: "550e8400-e29b-41d4-a716-446655440000" });
    expect(resultado.sucesso).toBe(true);
    expect(clientePrisma.cartaoCredito.deleteMany).toHaveBeenCalledWith({
      where: { id: "550e8400-e29b-41d4-a716-446655440000", contaFamiliaId: "familia-456" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/cartoes");
  });

  it("retorna NAO_ENCONTRADO quando deleteMany count é 0", async () => {
    vi.mocked(obterContextoUsuario).mockResolvedValue({
      ...contextoMock,
      dados: { ...contextoMock.dados, papel: "ADMIN" as const },
    });
    vi.mocked(clientePrisma.user.findUnique).mockResolvedValue({ role: "ADMIN" } as never);
    vi.mocked(clientePrisma.cartaoCredito.deleteMany).mockResolvedValue({ count: 0 });

    const resultado = await excluirCartao({ id: "550e8400-e29b-41d4-a716-446655440000" });
    expect(resultado.sucesso).toBe(false);
    if (!resultado.sucesso) expect(resultado.erro.tipo).toBe("NAO_ENCONTRADO");
  });

  it("retorna CONFLITO quando Prisma lança P2003 (vínculo dependente)", async () => {
    vi.mocked(obterContextoUsuario).mockResolvedValue({
      ...contextoMock,
      dados: { ...contextoMock.dados, papel: "ADMIN" as const },
    });
    vi.mocked(clientePrisma.user.findUnique).mockResolvedValue({ role: "ADMIN" } as never);
    vi.mocked(clientePrisma.cartaoCredito.deleteMany).mockRejectedValue({ code: "P2003" });

    const resultado = await excluirCartao({ id: "550e8400-e29b-41d4-a716-446655440000" });
    expect(resultado.sucesso).toBe(false);
    if (!resultado.sucesso) {
      expect(resultado.erro.tipo).toBe("CONFLITO");
      expect(resultado.erro.mensagem).toBe("Este cartão possui registros vinculados e não pode ser excluído.");
    }
  });
});
