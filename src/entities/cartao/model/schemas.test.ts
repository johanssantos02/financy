import { describe, expect, it } from "vitest";
import { schemaCartao, schemaEditarCartao } from "./schemas";

describe("schemaCartao", () => {
  const entradaValida = {
    nome: "Nubank",
    instituicao: "Nu Pagamentos",
    limite: "5000",
    diaFechamento: "3",
    diaVencimento: "10",
  };

  it("aceita entrada válida", () => {
    const resultado = schemaCartao.safeParse(entradaValida);
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.nome).toBe("Nubank");
      expect(resultado.data.limite).toBe("5000");
      expect(resultado.data.diaFechamento).toBe(3);
      expect(resultado.data.diaVencimento).toBe(10);
    }
  });

  it("transforma vírgula em ponto no limite", () => {
    const resultado = schemaCartao.safeParse({ ...entradaValida, limite: "5000,50" });
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.limite).toBe("5000.50");
    }
  });

  it("rejeita nome vazio", () => {
    const resultado = schemaCartao.safeParse({ ...entradaValida, nome: "" });
    expect(resultado.success).toBe(false);
  });

  it("rejeita nome só com espaços", () => {
    const resultado = schemaCartao.safeParse({ ...entradaValida, nome: "   " });
    expect(resultado.success).toBe(false);
  });

  it("rejeita nome com 61 caracteres", () => {
    const resultado = schemaCartao.safeParse({
      ...entradaValida,
      nome: "a".repeat(61),
    });
    expect(resultado.success).toBe(false);
  });

  it("aceita nome com 60 caracteres", () => {
    const resultado = schemaCartao.safeParse({
      ...entradaValida,
      nome: "a".repeat(60),
    });
    expect(resultado.success).toBe(true);
  });

  it("rejeita instituição vazia", () => {
    const resultado = schemaCartao.safeParse({ ...entradaValida, instituicao: "" });
    expect(resultado.success).toBe(false);
  });

  it("rejeita limite ausente", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { limite: _limite, ...semLimite } = entradaValida;
    const resultado = schemaCartao.safeParse(semLimite);
    expect(resultado.success).toBe(false);
  });

  it("rejeita limite zero", () => {
    const resultado = schemaCartao.safeParse({ ...entradaValida, limite: "0" });
    expect(resultado.success).toBe(false);
  });

  it("rejeita limite negativo (sem suporte a negativos)", () => {
    // O regex não aceita sinal negativo
    const resultado = schemaCartao.safeParse({ ...entradaValida, limite: "-1" });
    expect(resultado.success).toBe(false);
  });

  it("rejeita limite não numérico", () => {
    const resultado = schemaCartao.safeParse({ ...entradaValida, limite: "abc" });
    expect(resultado.success).toBe(false);
  });

  it("rejeita limite com mais de 10 dígitos inteiros", () => {
    const resultado = schemaCartao.safeParse({ ...entradaValida, limite: "12345678901" });
    expect(resultado.success).toBe(false);
  });

  it("rejeita dia de fechamento 0", () => {
    const resultado = schemaCartao.safeParse({ ...entradaValida, diaFechamento: "0" });
    expect(resultado.success).toBe(false);
  });

  it("rejeita dia de fechamento 32", () => {
    const resultado = schemaCartao.safeParse({ ...entradaValida, diaFechamento: "32" });
    expect(resultado.success).toBe(false);
  });

  it("rejeita dia decimal", () => {
    const resultado = schemaCartao.safeParse({ ...entradaValida, diaFechamento: "1.5" });
    expect(resultado.success).toBe(false);
  });

  it("rejeita dia não numérico", () => {
    const resultado = schemaCartao.safeParse({ ...entradaValida, diaFechamento: "abc" });
    expect(resultado.success).toBe(false);
  });

  it("aceita dia 1", () => {
    const resultado = schemaCartao.safeParse({ ...entradaValida, diaFechamento: "1" });
    expect(resultado.success).toBe(true);
  });

  it("aceita dia 31", () => {
    const resultado = schemaCartao.safeParse({ ...entradaValida, diaFechamento: "31" });
    expect(resultado.success).toBe(true);
  });

  it("descarta campos extras como contaFamiliaId e cvv", () => {
    const resultado = schemaCartao.safeParse({
      ...entradaValida,
      contaFamiliaId: "algum-id",
      cvv: "123",
      numero: "1234 5678 9012 3456",
    });
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data).not.toHaveProperty("contaFamiliaId");
      expect(resultado.data).not.toHaveProperty("cvv");
      expect(resultado.data).not.toHaveProperty("numero");
    }
  });
});

describe("schemaEditarCartao", () => {
  const entradaValida = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    nome: "Nubank",
    instituicao: "Nu Pagamentos",
    limite: "5000",
    diaFechamento: "3",
    diaVencimento: "10",
  };

  it("aceita entrada válida com id uuid", () => {
    const resultado = schemaEditarCartao.safeParse(entradaValida);
    expect(resultado.success).toBe(true);
  });

  it("rejeita id inválido", () => {
    const resultado = schemaEditarCartao.safeParse({ ...entradaValida, id: "nao-e-uuid" });
    expect(resultado.success).toBe(false);
  });

  it("rejeita id ausente", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...semId } = entradaValida;
    const resultado = schemaEditarCartao.safeParse(semId);
    expect(resultado.success).toBe(false);
  });
});
