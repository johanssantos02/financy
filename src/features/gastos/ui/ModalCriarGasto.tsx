"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type MouseEvent,
} from "react";
import Link from "next/link";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { z } from "zod";

import { schemaGasto } from "@/src/entities/gasto";
import type { ResumoCartao } from "@/src/entities/cartao";
import type { ResumoTag } from "@/src/entities/tag";
import { formatarValor, mascararValor, valorDaMascara } from "@/src/shared/lib/moeda";
import { hojeEmSaoPaulo } from "@/src/shared/lib/datas";
import { lerFormData } from "@/src/shared/lib/formulario";
import type { ErroAplicacao } from "@/src/shared/lib/resultado";

import { buscarCartoesFamilia, buscarSaldoAtual, buscarTagsGasto, criarGasto } from "../api/acoes";
import SeletorTag from "./SeletorTag";

const CAMPOS = ["nome", "valor", "formaPagamento", "data", "cartaoId", "tagId"] as const;
type Campo = (typeof CAMPOS)[number];
type ErrosPorCampo = Partial<Record<Campo, string>>;

const ehCampo = (valor: string): valor is Campo => (CAMPOS as readonly string[]).includes(valor);

const primeiraMensagemPorCampo = (campos: Record<string, string[] | undefined>): ErrosPorCampo =>
  Object.fromEntries(
    Object.entries(campos).flatMap(([campo, mensagens]) =>
      ehCampo(campo) && mensagens?.[0] ? [[campo, mensagens[0]]] : []
    )
  );

const errosDoServidor = (erro: ErroAplicacao): ErrosPorCampo => {
  if (erro.tipo === "VALIDACAO" && erro.campos) return primeiraMensagemPorCampo(erro.campos);
  return {};
};

const classeCampo = (comErro: boolean) =>
  `w-full rounded-xl border bg-card px-3 text-texto placeholder:text-texto-off focus:outline-none focus:ring-2 ${
    comErro ? "border-perigo focus:ring-perigo" : "border-borda focus:ring-primaria"
  }`;

const classeRotulo = "text-sm font-medium text-texto";
const classeBotaoAcao =
  "flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

function MensagemErro({ campo, mensagem }: { campo: Campo; mensagem?: string }) {
  if (!mensagem) return null;
  return (
    <p id={`gasto-${campo}-erro`} className="text-sm text-perigo">
      {mensagem}
    </p>
  );
}

type Props = {
  aberto: boolean;
  onFechar: () => void;
};

export default function ModalCriarGasto({ aberto, onFechar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const formulario = useRef<HTMLFormElement>(null);
  const idTitulo = useId();
  const [erros, setErros] = useState<ErrosPorCampo>({});
  const [enviando, iniciarEnvio] = useTransition();
  const [valorMascarado, setValorMascarado] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<"DINHEIRO" | "CARTAO">("DINHEIRO");
  const [dataGasto, setDataGasto] = useState(hojeEmSaoPaulo());
  const [cartoes, setCartoes] = useState<ResumoCartao[] | null>(null);
  // Inicia como true: o componente remonta a cada abertura (key no pai), logo montagem = abertura.
  const [carregandoCartoes, setCarregandoCartoes] = useState(true);
  const [saldo, setSaldo] = useState<string | null>(null);
  const [tags, setTags] = useState<ResumoTag[]>([]);

  // Busca cartões, saldo e tags ao montar (equivale a "ao abrir", pois key força remontagem).
  useEffect(() => {
    Promise.all([buscarCartoesFamilia(), buscarSaldoAtual(), buscarTagsGasto()]).then(
      ([resultadoCartoes, resultadoSaldo, resultadoTags]) => {
        setCartoes(resultadoCartoes.sucesso ? resultadoCartoes.dados : []);
        setSaldo(resultadoSaldo.sucesso ? resultadoSaldo.dados : null);
        setTags(resultadoTags.sucesso ? resultadoTags.dados : []);
        setCarregandoCartoes(false);
      }
    );
  }, []);

  // Controla abertura/fechamento do <dialog> nativo.
  useEffect(() => {
    const el = dialogo.current;
    if (!el) return;
    if (aberto) {
      el.showModal();
    } else {
      el.close();
    }
  }, [aberto]);

  const fecharAoClicarFora = (evento: MouseEvent<HTMLDialogElement>) => {
    if (!enviando && evento.target === evento.currentTarget) onFechar();
  };

  const exibirErros = (novosErros: ErrosPorCampo) => {
    setErros(novosErros);
    const primeiro = CAMPOS.find((campo) => novosErros[campo]);
    if (!primeiro) return;
    const elemento = formulario.current?.elements.namedItem(primeiro);
    if (elemento instanceof HTMLElement) elemento.focus();
  };

  const limparErro = (evento: FormEvent<HTMLFormElement>) => {
    const { name } = evento.target as HTMLInputElement;
    if (!ehCampo(name) || !erros[name]) return;
    setErros((atuais) => ({ ...atuais, [name]: undefined }));
  };

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (enviando) return;
    const dados = new FormData(evento.currentTarget);
    dados.set("valor", valorDaMascara(String(dados.get("valor") ?? "")));

    const validacao = schemaGasto.safeParse(lerFormData(dados));
    if (!validacao.success) {
      toast.error("Verifique os campos informados.");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      exibirErros(primeiraMensagemPorCampo(z.flattenError(validacao.error as any).fieldErrors));
      return;
    }

    iniciarEnvio(async () => {
      const resultado = await criarGasto(dados);
      if (resultado.sucesso) {
        toast.success("Gasto registrado.");
        onFechar();
        return;
      }
      toast.error(resultado.erro.mensagem);
      exibirErros(errosDoServidor(resultado.erro));
    });
  };

  const propsAcessibilidade = (campo: Campo) =>
    erros[campo] ? { "aria-invalid": true, "aria-describedby": `gasto-${campo}-erro` } : {};

  return (
    <dialog
      ref={dialogo}
      aria-labelledby={idTitulo}
      onClick={fecharAoClicarFora}
      onClose={() => {
        if (aberto) onFechar();
      }}
      className="m-auto w-full max-w-md rounded-2xl bg-fundo p-0 shadow-xl backdrop:bg-black/50 open:flex open:flex-col"
    >
      <div className="flex items-center justify-between border-b border-borda px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <h2 id={idTitulo} className="text-base font-semibold text-texto">
            Novo gasto
          </h2>
          {saldo !== null ? (
            <p className="text-xs text-texto-sec">
              Saldo:{" "}
              <span
                className={`font-medium ${Number(saldo) >= 0 ? "text-primaria" : "text-perigo"}`}
              >
                {formatarValor(saldo)}
              </span>
            </p>
          ) : (
            <div className="h-3.5 w-24 animate-pulse rounded bg-fundo-sec" />
          )}
        </div>
        <button
          type="button"
          onClick={onFechar}
          disabled={enviando}
          aria-label="Fechar"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-texto-sec hover:bg-fundo-sec focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria disabled:opacity-60"
        >
          <X size={18} strokeWidth={1.75} />
        </button>
      </div>

      <form
        ref={formulario}
        noValidate
        onSubmit={enviar}
        onInput={limparErro}
        className="flex flex-col gap-4 p-5"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="gasto-nome" className={classeRotulo}>
            Nome *
          </label>
          <input
            id="gasto-nome"
            name="nome"
            type="text"
            maxLength={80}
            autoComplete="off"
            placeholder="Ex.: Mercado"
            className={`h-11 ${classeCampo(Boolean(erros.nome))}`}
            {...propsAcessibilidade("nome")}
          />
          <MensagemErro campo="nome" mensagem={erros.nome} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="gasto-valor" className={classeRotulo}>
            Valor *
          </label>
          <input
            id="gasto-valor"
            name="valor"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="R$ 0,00"
            value={valorMascarado}
            onChange={(evento) => setValorMascarado(mascararValor(evento.target.value))}
            onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
            className={`h-11 ${classeCampo(Boolean(erros.valor))}`}
            {...propsAcessibilidade("valor")}
          />
          <MensagemErro campo="valor" mensagem={erros.valor} />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={classeRotulo}>Forma de pagamento *</span>
          <div role="group" aria-label="Forma de pagamento" className="grid grid-cols-2 gap-2">
            {(["DINHEIRO", "CARTAO"] as const).map((forma) => (
              <label
                key={forma}
                className={`flex h-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-medium transition-colors ${
                  formaPagamento === forma
                    ? "border-primaria bg-primaria/10 text-primaria"
                    : "border-borda bg-card text-texto hover:bg-fundo-sec"
                }`}
              >
                <input
                  type="radio"
                  name="formaPagamento"
                  value={forma}
                  checked={formaPagamento === forma}
                  onChange={() => setFormaPagamento(forma)}
                  className="sr-only"
                  {...(erros.formaPagamento ? { "aria-invalid": true } : {})}
                />
                {forma === "DINHEIRO" ? "Dinheiro" : "Cartão"}
              </label>
            ))}
          </div>
          <MensagemErro campo="formaPagamento" mensagem={erros.formaPagamento} />
        </div>

        {formaPagamento === "CARTAO" && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="gasto-cartaoId" className={classeRotulo}>
              Cartão *
            </label>
            {carregandoCartoes ? (
              <div className="h-11 animate-pulse rounded-xl bg-fundo-sec" />
            ) : cartoes && cartoes.length === 0 ? (
              <p className="text-sm text-texto-sec">
                Nenhum cartão cadastrado.{" "}
                <Link href="/cartoes" className="text-primaria underline">
                  Cadastrar cartão
                </Link>
              </p>
            ) : (
              <select
                id="gasto-cartaoId"
                name="cartaoId"
                defaultValue=""
                className={`h-11 ${classeCampo(Boolean(erros.cartaoId))}`}
                {...propsAcessibilidade("cartaoId")}
              >
                <option value="" disabled>
                  Selecione um cartão
                </option>
                {(cartoes ?? []).map((cartao) => (
                  <option key={cartao.id} value={cartao.id}>
                    {cartao.nome} — disponível{" "}
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(Number(cartao.limite) - Number(cartao.limiteUsado))}
                  </option>
                ))}
              </select>
            )}
            <MensagemErro campo="cartaoId" mensagem={erros.cartaoId} />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="gasto-data" className={classeRotulo}>
            Data *
          </label>
          <input
            id="gasto-data"
            name="data"
            type="date"
            value={dataGasto}
            onChange={(e) => setDataGasto(e.target.value)}
            className={`h-11 ${classeCampo(Boolean(erros.data))}`}
            {...propsAcessibilidade("data")}
          />
          <MensagemErro campo="data" mensagem={erros.data} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="gasto-tagId" className={classeRotulo}>
            Categoria
          </label>
          <SeletorTag tags={tags} comErro={Boolean(erros.tagId)} />
          {erros.tagId && (
            <p id="gasto-tagId-erro" role="alert" className="text-sm text-perigo">
              {erros.tagId}
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onFechar}
            disabled={enviando}
            className={`${classeBotaoAcao} border border-borda bg-card text-texto hover:bg-fundo-sec`}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className={`${classeBotaoAcao} bg-primaria text-white hover:bg-primaria-escuro`}
          >
            {enviando ? "Salvando…" : "Registrar"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
