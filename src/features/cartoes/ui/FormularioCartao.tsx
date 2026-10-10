"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { z } from "zod";

import { type DetalheCartao, schemaCartao, schemaEditarCartao } from "@/src/entities/cartao";
import { PreviaCartao } from "@/src/entities/cartao";
import { lerFormData } from "@/src/shared/lib/formulario";
import { mascararValor, valorDaMascara } from "@/src/shared/lib/moeda";
import type { ErroAplicacao } from "@/src/shared/lib/resultado";

import { criarCartao, editarCartao } from "../api/acoes";

// A ordem define qual campo recebe o foco quando há mais de um inválido.
const CAMPOS = ["nome", "instituicao", "limite", "diaFechamento", "diaVencimento", "cor"] as const;
type Campo = (typeof CAMPOS)[number];
type ErrosPorCampo = Partial<Record<Campo, string>>;

const ROTA_PADRAO = "/cartoes";

const ehCampo = (valor: string): valor is Campo => (CAMPOS as readonly string[]).includes(valor);

const primeiraMensagemPorCampo = (campos: Record<string, string[] | undefined>): ErrosPorCampo =>
  Object.fromEntries(
    Object.entries(campos).flatMap(([campo, mensagens]) =>
      ehCampo(campo) && mensagens?.[0] ? [[campo, mensagens[0]]] : []
    )
  );

const errosDoServidor = (erro: ErroAplicacao): ErrosPorCampo => {
  if (erro.tipo === "CONFLITO") return { nome: erro.mensagem };
  if (erro.tipo === "VALIDACAO" && erro.campos) return primeiraMensagemPorCampo(erro.campos);
  return {};
};

const classeCampo = (comErro: boolean) =>
  `w-full rounded-2xl border bg-card px-4 text-texto placeholder:text-texto-off focus:outline-none focus:ring-2 ${
    comErro ? "border-perigo focus:ring-perigo" : "border-borda focus:ring-primaria"
  }`;

const classeRotulo = "text-sm font-medium text-texto";

function MensagemErro({ campo, mensagem }: { campo: Campo; mensagem?: string }) {
  if (!mensagem) return null;
  return (
    <p id={`${campo}-erro`} className="text-sm text-perigo">
      {mensagem}
    </p>
  );
}

type Props = {
  modo: "criar" | "editar";
  cartao?: DetalheCartao;
};

export default function FormularioCartao({ modo, cartao }: Props) {
  const router = useRouter();
  const formulario = useRef<HTMLFormElement>(null);
  const [erros, setErros] = useState<ErrosPorCampo>({});
  const [enviando, iniciarEnvio] = useTransition();
  const [concluido, setConcluido] = useState(false);
  const bloqueado = enviando || concluido;

  // Estado da prévia — atualizado em tempo real via onInput
  const [previa, setPrevia] = useState({
    nome: cartao?.nome ?? "",
    instituicao: cartao?.instituicao ?? "",
    limite: cartao?.limite ?? "",
    diaFechamento: cartao?.diaFechamento?.toString() ?? "",
    diaVencimento: cartao?.diaVencimento?.toString() ?? "",
    cor: cartao?.cor ?? "",
  });

  const voltar = () => {
    router.replace(ROTA_PADRAO);
  };

  const exibirErros = (novosErros: ErrosPorCampo) => {
    setErros(novosErros);
    const primeiro = CAMPOS.find((campo) => novosErros[campo]);
    const elemento = primeiro ? formulario.current?.elements.namedItem(primeiro) : null;
    if (elemento instanceof HTMLElement) elemento.focus();
  };

  const limparErro = (evento: FormEvent<HTMLFormElement>) => {
    const { name } = evento.target as HTMLInputElement;
    if (!ehCampo(name) || !erros[name]) return;
    setErros((atuais) => ({ ...atuais, [name]: undefined }));
  };

  const atualizarPrevia = (evento: FormEvent<HTMLFormElement>) => {
    const el = evento.target as HTMLInputElement;
    if (!ehCampo(el.name)) return;
    setPrevia((atual) => ({ ...atual, [el.name]: el.value }));
  };

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (bloqueado) return;
    const dados = new FormData(evento.currentTarget);
    dados.set("limite", valorDaMascara(String(dados.get("limite") ?? "")));

    const schema = modo === "criar" ? schemaCartao : schemaEditarCartao;
    const validacao = schema.safeParse(lerFormData(dados));
    if (!validacao.success) {
      toast.error("Verifique os campos informados.");
      exibirErros(primeiraMensagemPorCampo(z.flattenError(validacao.error).fieldErrors));
      return;
    }

    iniciarEnvio(async () => {
      const acao = modo === "criar" ? criarCartao : editarCartao;
      const resultado = await acao(dados);

      if (resultado.sucesso) {
        toast.success(modo === "criar" ? "Cartão cadastrado." : "Cartão atualizado.");
        setConcluido(true);
        voltar();
        return;
      }

      toast.error(resultado.erro.mensagem);
      exibirErros(errosDoServidor(resultado.erro));
    });
  };

  const propsAcessibilidade = (campo: Campo) =>
    erros[campo] ? { "aria-invalid": true as const, "aria-describedby": `${campo}-erro` } : {};

  // Valor inicial do limite formatado para exibição no modo edição
  const limiteInicial =
    cartao?.limite
      ? mascararValor(
          // cartao.limite é "1234.56", converte para centavos (string de dígitos)
          Math.round(Number(cartao.limite) * 100).toString()
        )
      : "";

  return (
    <div className="flex flex-col gap-5 pb-[calc(80px+env(safe-area-inset-bottom))]">
      {/* Prévia do cartão */}
      <PreviaCartao
        nome={previa.nome}
        instituicao={previa.instituicao}
        limite={valorDaMascara(previa.limite.replace(/\D/g, "").padStart(3, "0")) || previa.limite}
        diaFechamento={previa.diaFechamento}
        diaVencimento={previa.diaVencimento}
        cor={previa.cor || null}
      />

      <form
        ref={formulario}
        noValidate
        onSubmit={enviar}
        onInput={(e) => {
          limparErro(e);
          atualizarPrevia(e);
        }}
        className="flex flex-col gap-5"
      >
        {modo === "editar" && cartao && (
          <input type="hidden" name="id" value={cartao.id} />
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="nome" className={classeRotulo}>
            Nome do cartão *
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            maxLength={60}
            autoComplete="off"
            placeholder="Ex.: Nubank"
            defaultValue={cartao?.nome}
            className={`h-12 ${classeCampo(Boolean(erros.nome))}`}
            {...propsAcessibilidade("nome")}
          />
          <MensagemErro campo="nome" mensagem={erros.nome} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="instituicao" className={classeRotulo}>
            Instituição financeira *
          </label>
          <input
            id="instituicao"
            name="instituicao"
            type="text"
            maxLength={60}
            autoComplete="off"
            placeholder="Ex.: Nu Pagamentos"
            defaultValue={cartao?.instituicao}
            className={`h-12 ${classeCampo(Boolean(erros.instituicao))}`}
            {...propsAcessibilidade("instituicao")}
          />
          <MensagemErro campo="instituicao" mensagem={erros.instituicao} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="limite" className={classeRotulo}>
            Limite total *
          </label>
          <input
            id="limite"
            name="limite"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="R$ 0,00"
            defaultValue={limiteInicial}
            onChange={(evento) => {
              const mascarado = mascararValor(evento.target.value);
              evento.target.value = mascarado;
              setPrevia((atual) => ({ ...atual, limite: mascarado }));
            }}
            className={`h-12 ${classeCampo(Boolean(erros.limite))}`}
            {...propsAcessibilidade("limite")}
          />
          <MensagemErro campo="limite" mensagem={erros.limite} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="diaFechamento" className={classeRotulo}>
              Dia de fechamento *
            </label>
            <input
              id="diaFechamento"
              name="diaFechamento"
              type="text"
              inputMode="numeric"
              maxLength={2}
              placeholder="Ex.: 3"
              defaultValue={cartao?.diaFechamento}
              className={`h-12 ${classeCampo(Boolean(erros.diaFechamento))}`}
              {...propsAcessibilidade("diaFechamento")}
            />
            <MensagemErro campo="diaFechamento" mensagem={erros.diaFechamento} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="diaVencimento" className={classeRotulo}>
              Dia de vencimento *
            </label>
            <input
              id="diaVencimento"
              name="diaVencimento"
              type="text"
              inputMode="numeric"
              maxLength={2}
              placeholder="Ex.: 10"
              defaultValue={cartao?.diaVencimento}
              className={`h-12 ${classeCampo(Boolean(erros.diaVencimento))}`}
              {...propsAcessibilidade("diaVencimento")}
            />
            <MensagemErro campo="diaVencimento" mensagem={erros.diaVencimento} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="cor" className={classeRotulo}>
            Cor do cartão
          </label>
          <div className="flex items-center gap-3">
            <input
              id="cor"
              name="cor"
              type="color"
              defaultValue={cartao?.cor ?? "#6366f1"}
              onChange={(evento) => {
                setPrevia((atual) => ({ ...atual, cor: evento.target.value }));
              }}
              className="h-12 w-14 cursor-pointer rounded-xl border border-borda bg-card p-1 focus:outline-none focus:ring-2 focus:ring-primaria"
            />
            <span className="text-sm text-texto-sec">
              Toque para escolher a cor do cartão
            </span>
          </div>
          <MensagemErro campo="cor" mensagem={erros.cor} />
        </div>

        {/* Botão fixo no rodapé acima da navbar */}
        <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-0 right-0 z-40 bg-fundo/90 backdrop-blur-sm px-4 py-3 border-t border-borda">
          <button
            type="submit"
            disabled={bloqueado}
            className="w-full h-12 rounded-2xl bg-primaria text-white text-sm font-medium hover:bg-primaria-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando
              ? "Salvando…"
              : modo === "criar"
              ? "Salvar cartão"
              : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
