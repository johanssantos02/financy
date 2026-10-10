// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("../api/acoes", () => ({
  criarCartao: vi.fn(),
  editarCartao: vi.fn(),
}));

import FormularioCartao from "./FormularioCartao";
import { criarCartao, editarCartao } from "../api/acoes";

const resultadoSucesso = { sucesso: true as const, dados: { id: "cartao-123" } };
const resultadoConflito = {
  sucesso: false as const,
  erro: { status: 409 as const, tipo: "CONFLITO" as const, mensagem: "Já existe um cartão com este nome." },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FormularioCartao", () => {
  it("renderiza os cinco campos obrigatórios rotulados", () => {
    render(<FormularioCartao modo="criar" />);

    expect(screen.getByLabelText(/nome do cartão/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/instituição financeira/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/limite total/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dia de fechamento/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dia de vencimento/i)).toBeInTheDocument();
  });

  it("não renderiza campos sensíveis como número, CVV, validade ou titular", () => {
    render(<FormularioCartao modo="criar" />);

    expect(screen.queryByLabelText(/número/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/cvv/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/validade/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/titular/i)).not.toBeInTheDocument();
  });

  it("mostra erro e destaca campo quando envio retorna CONFLITO (nome duplicado)", async () => {
    vi.mocked(criarCartao).mockResolvedValue(resultadoConflito);

    const user = userEvent.setup();
    render(<FormularioCartao modo="criar" />);

    await user.type(screen.getByLabelText(/nome do cartão/i), "Nubank");
    await user.type(screen.getByLabelText(/instituição financeira/i), "Nu Pagamentos");
    await user.type(screen.getByLabelText(/limite total/i), "5000");
    await user.type(screen.getByLabelText(/dia de fechamento/i), "3");
    await user.type(screen.getByLabelText(/dia de vencimento/i), "10");

    const botao = screen.getByRole("button", { name: /salvar/i });
    await user.click(botao);

    await waitFor(() => {
      expect(screen.getByLabelText(/nome do cartão/i)).toHaveAttribute("aria-invalid", "true");
    });
    // O campo nome ainda mantém o valor digitado
    expect(screen.getByLabelText(/nome do cartão/i)).toHaveValue("Nubank");
  });

  it("modo editar preenche campos com valores do cartão e envia editarCartao", async () => {
    vi.mocked(editarCartao).mockResolvedValue(resultadoSucesso);

    const cartaoExistente = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      nome: "Nubank",
      instituicao: "Nu Pagamentos",
      limite: "5000.00",
      diaFechamento: 3,
      diaVencimento: 10,
      cor: null,
    };

    render(<FormularioCartao modo="editar" cartao={cartaoExistente} />);

    expect(screen.getByLabelText(/nome do cartão/i)).toHaveValue("Nubank");
    expect(screen.getByLabelText(/instituição financeira/i)).toHaveValue("Nu Pagamentos");
    expect(screen.getByLabelText(/dia de fechamento/i)).toHaveValue("3");
    expect(screen.getByLabelText(/dia de vencimento/i)).toHaveValue("10");
    expect(screen.getByRole("button", { name: /salvar alterações/i })).toBeInTheDocument();
  });

  it("chama criarCartao apenas uma vez mesmo com dois cliques rápidos", async () => {
    vi.mocked(criarCartao).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(resultadoSucesso), 100))
    );

    const user = userEvent.setup();
    render(<FormularioCartao modo="criar" />);

    await user.type(screen.getByLabelText(/nome do cartão/i), "Nubank");
    await user.type(screen.getByLabelText(/instituição financeira/i), "Nu Pagamentos");
    // Limite via input direto
    const limiteInput = screen.getByLabelText(/limite total/i);
    await user.type(limiteInput, "5000");
    await user.type(screen.getByLabelText(/dia de fechamento/i), "3");
    await user.type(screen.getByLabelText(/dia de vencimento/i), "10");

    const botao = screen.getByRole("button", { name: /salvar/i });
    await user.click(botao);
    await user.click(botao); // segundo clique

    await waitFor(() => {
      expect(criarCartao).toHaveBeenCalledTimes(1);
    });
  });
});
