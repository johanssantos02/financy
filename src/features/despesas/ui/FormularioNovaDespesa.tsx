"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { z } from "zod";

import { mascararValor, schemaDespesa, valorDaMascara } from "@/src/entities/despesa";
import { lerFormData } from "@/src/shared/lib/formulario";
import type { ErroAplicacao } from "@/src/shared/lib/resultado";

import { criarDespesa } from "../api/acoes";

// A ordem define qual campo recebe o foco quando há mais de um inválido.
const CAMPOS = ["nome", "descricao", "vencimento", "valor"] as const;
type Campo = (typeof CAMPOS)[number];
type ErrosPorCampo = Partial<Record<Campo, string>>;

const ROTA_PADRAO = "/despesas";
const MENSAGEM_VALIDACAO = "Verifique os campos informados.";

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
  `w-full rounded-xl border bg-card px-3 text-texto placeholder:text-texto-off focus:outline-none focus:ring-2 ${
    comErro ? "border-perigo focus:ring-perigo" : "border-borda focus:ring-primaria"
  }`;

const classeRotulo = "text-sm font-medium text-texto";
const classeBotao =
  "flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

function MensagemErro({ campo, mensagem }: { campo: Campo; mensagem?: string }) {
  if (!mensagem) return null;
  return (
    <p id={`${campo}-erro`} className="text-sm text-perigo">
      {mensagem}
    </p>
  );
}

export default function FormularioNovaDespesa({ origem }: { origem: string | null }) {
  const router = useRouter();
  const formulario = useRef<HTMLFormElement>(null);
  const campoContinuar = useRef<HTMLInputElement>(null);
  const [erros, setErros] = useState<ErrosPorCampo>({});
  const [enviando, iniciarEnvio] = useTransition();
  const [concluido, setConcluido] = useState(false);
  const [continuarAdicionando, setContinuarAdicionando] = useState(false);
  const bloqueado = enviando || concluido;

  const voltar = () => {
    if (origem !== null && window.history.length > 1) {
      router.back();
      return;
    }
    router.replace(origem ?? ROTA_PADRAO);
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

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (bloqueado) return;
    const dados = new FormData(evento.currentTarget);
    dados.set("valor", valorDaMascara(String(dados.get("valor") ?? "")));

    const validacao = schemaDespesa.safeParse(lerFormData(dados));
    if (!validacao.success) {
      toast.error(MENSAGEM_VALIDACAO);
      exibirErros(primeiraMensagemPorCampo(z.flattenError(validacao.error).fieldErrors));
      return;
    }

    iniciarEnvio(async () => {
      const resultado = await criarDespesa(dados);
      if (resultado.sucesso) {
        toast.success("Despesa cadastrada.");
        if (continuarAdicionando) {
          formulario.current?.reset();
          if (campoContinuar.current) campoContinuar.current.checked = true;
          setErros({});
          const nome = formulario.current?.elements.namedItem("nome");
          if (nome instanceof HTMLElement) nome.focus();
          return;
        }
        setConcluido(true);
        voltar();
        return;
      }
      toast.error(resultado.erro.mensagem);
      exibirErros(errosDoServidor(resultado.erro));
    });
  };

  const propsAcessibilidade = (campo: Campo) =>
    erros[campo] ? { "aria-invalid": true, "aria-describedby": `${campo}-erro` } : {};

  return (
    <div className="flex flex-col gap-5">
      <form
        ref={formulario}
        noValidate
        onSubmit={enviar}
        onInput={limparErro}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nome" className={classeRotulo}>
            Nome *
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            maxLength={80}
            autoComplete="off"
            placeholder="Ex.: Internet"
            className={`h-11 ${classeCampo(Boolean(erros.nome))}`}
            {...propsAcessibilidade("nome")}
          />
          <MensagemErro campo="nome" mensagem={erros.nome} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="descricao" className={classeRotulo}>
            Descrição
          </label>
          <textarea
            id="descricao"
            name="descricao"
            maxLength={500}
            rows={3}
            className={`py-2 ${classeCampo(Boolean(erros.descricao))}`}
            {...propsAcessibilidade("descricao")}
          />
          <MensagemErro campo="descricao" mensagem={erros.descricao} />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="vencimento" className={classeRotulo}>
              Vencimento *
            </label>
            <input
              id="vencimento"
              name="vencimento"
              type="date"
              className={`h-11 ${classeCampo(Boolean(erros.vencimento))}`}
              {...propsAcessibilidade("vencimento")}
            />
            <MensagemErro campo="vencimento" mensagem={erros.vencimento} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="valor" className={classeRotulo}>
              Valor *
            </label>
            <input
              id="valor"
              name="valor"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="R$ 0,00"
              onChange={(evento) => {
                evento.target.value = mascararValor(evento.target.value);
              }}
              className={`h-11 ${classeCampo(Boolean(erros.valor))}`}
              {...propsAcessibilidade("valor")}
            />
            <MensagemErro campo="valor" mensagem={erros.valor} />
          </div>
        </div>

        <label className="flex min-h-11 items-center gap-3 text-sm text-texto">
          <input type="checkbox" name="recorrente" className="h-5 w-5 accent-primaria" />
          Despesa recorrente
        </label>

        {/* Sem `name` para não ser enviado; o estado é restaurado após o reset do cadastro. */}
        <label className="flex min-h-11 items-center gap-3 text-sm text-texto">
          <input
            ref={campoContinuar}
            type="checkbox"
            checked={continuarAdicionando}
            onChange={(evento) => setContinuarAdicionando(evento.target.checked)}
            disabled={bloqueado}
            className="h-5 w-5 accent-primaria"
          />
          Continuar adicionando despesas
        </label>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={voltar}
            disabled={bloqueado}
            className={`${classeBotao} border border-borda bg-card text-texto hover:bg-fundo-sec`}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={bloqueado}
            className={`${classeBotao} bg-primaria text-white hover:bg-primaria-escuro`}
          >
            {bloqueado ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
