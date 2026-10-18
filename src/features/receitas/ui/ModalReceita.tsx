"use client";

import { useEffect, useId, useRef, useState, useTransition, type FormEvent, type MouseEvent } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { z } from "zod";

import { schemaEditarReceita, schemaReceita, type DetalheReceita } from "@/src/entities/receita";
import { lerFormData } from "@/src/shared/lib/formulario";
import { mascararValor, valorDaMascara } from "@/src/shared/lib/moeda";
import type { ErroAplicacao } from "@/src/shared/lib/resultado";

import { criarReceita, editarReceita } from "../api/acoes";

const CAMPOS = ["valor", "tipo", "descricao", "competencia"] as const;
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
  `w-full rounded-2xl border bg-card px-4 text-texto placeholder:text-texto-off focus:outline-none focus:ring-2 ${
    comErro ? "border-perigo focus:ring-perigo" : "border-borda focus:ring-primaria"
  }`;

const classeRotulo = "text-sm font-medium text-texto";

function MensagemErro({ campo, mensagem }: { campo: Campo; mensagem?: string }) {
  if (!mensagem) return null;
  return (
    <p id={`receita-${campo}-erro`} className="text-sm text-perigo">
      {mensagem}
    </p>
  );
}

type Props = {
  modo: "criar" | "editar";
  receita?: DetalheReceita;
  aberto: boolean;
  onFechar: () => void;
};

const valorInicial = (receita?: DetalheReceita) =>
  receita?.valor ? mascararValor(Math.round(Number(receita.valor) * 100).toString()) : "";

export default function ModalReceita({ modo, receita, aberto, onFechar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const formulario = useRef<HTMLFormElement>(null);
  const idTitulo = useId();

  const [erros, setErros] = useState<ErrosPorCampo>({});
  const [enviando, iniciarEnvio] = useTransition();
  const [tipoSelecionado, setTipoSelecionado] = useState<string>(receita?.tipo ?? "OUTRO");
  const [valorMascarado, setValorMascarado] = useState(() => valorInicial(receita));

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
    if (evento.target === evento.currentTarget) onFechar();
  };

  const limparErro = (evento: FormEvent<HTMLFormElement>) => {
    const { name } = evento.target as HTMLInputElement;
    if (!ehCampo(name) || !erros[name]) return;
    setErros((atuais) => ({ ...atuais, [name]: undefined }));
  };

  const exibirErros = (novosErros: ErrosPorCampo) => {
    setErros(novosErros);
    const primeiro = CAMPOS.find((campo) => novosErros[campo]);
    const elemento = primeiro ? formulario.current?.elements.namedItem(primeiro) : null;
    if (elemento instanceof HTMLElement) elemento.focus();
  };

  const propsAcessibilidade = (campo: Campo) =>
    erros[campo]
      ? { "aria-invalid": true as const, "aria-describedby": `receita-${campo}-erro` }
      : {};

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (enviando) return;
    const dados = new FormData(evento.currentTarget);
    dados.set("valor", valorDaMascara(String(dados.get("valor") ?? "")));

    if (tipoSelecionado !== "SALARIO") {
      dados.delete("competencia");
    }

    const schema = modo === "criar" ? schemaReceita : schemaEditarReceita;
    const validacao = schema.safeParse(lerFormData(dados));
    if (!validacao.success) {
      toast.error("Verifique os campos informados.");
      exibirErros(primeiraMensagemPorCampo(z.flattenError(validacao.error).fieldErrors));
      return;
    }

    iniciarEnvio(async () => {
      const acao = modo === "criar" ? criarReceita : editarReceita;
      const resultado = await acao(dados);

      if (resultado.sucesso) {
        toast.success(modo === "criar" ? "Receita cadastrada." : "Receita atualizada.");
        onFechar();
        return;
      }

      toast.error(resultado.erro.mensagem);
      exibirErros(errosDoServidor(resultado.erro));
    });
  };

  return (
    <dialog
      ref={dialogo}
      onClick={fecharAoClicarFora}
      onClose={() => {
        // Captura o fechamento por tecla Esc (nativo do <dialog>).
        if (aberto) onFechar();
      }}
      aria-labelledby={idTitulo}
      className="mx-auto mb-0 mt-auto w-full max-w-none rounded-t-2xl bg-card p-0 text-texto shadow-lg backdrop:bg-black/40 md:my-auto md:max-w-sm md:rounded-2xl"
    >
      <div className="flex flex-col gap-4 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-4">
        <header className="flex items-center justify-between gap-3">
          <h2 id={idTitulo} className="font-semibold">
            {modo === "criar" ? "Nova entrada" : "Editar entrada"}
          </h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-texto-sec hover:bg-fundo-sec focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </header>

        <form
          ref={formulario}
          noValidate
          onSubmit={enviar}
          onInput={limparErro}
          className="flex flex-col gap-4"
        >
          {modo === "editar" && receita && (
            <input type="hidden" name="id" value={receita.id} />
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="receita-valor" className={classeRotulo}>
              Valor *
            </label>
            <input
              id="receita-valor"
              name="valor"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="R$ 0,00"
              value={valorMascarado}
              onChange={(e) => setValorMascarado(mascararValor(e.target.value))}
              className={`h-12 ${classeCampo(Boolean(erros.valor))}`}
              {...propsAcessibilidade("valor")}
            />
            <MensagemErro campo="valor" mensagem={erros.valor} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="receita-tipo" className={classeRotulo}>
              Tipo *
            </label>
            <select
              id="receita-tipo"
              name="tipo"
              value={tipoSelecionado}
              onChange={(e) => {
                setTipoSelecionado(e.target.value);
                if (e.target.value !== "SALARIO") {
                  setErros((atual) => ({ ...atual, competencia: undefined }));
                }
              }}
              className={`h-12 ${classeCampo(Boolean(erros.tipo))}`}
              {...propsAcessibilidade("tipo")}
            >
              <option value="OUTRO">Outro</option>
              <option value="SALARIO">Salário</option>
            </select>
            <MensagemErro campo="tipo" mensagem={erros.tipo} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="receita-descricao" className={classeRotulo}>
              Descrição
            </label>
            <textarea
              id="receita-descricao"
              name="descricao"
              maxLength={500}
              rows={2}
              placeholder="Opcional"
              defaultValue={receita?.descricao ?? ""}
              className={`resize-none py-3 ${classeCampo(Boolean(erros.descricao))}`}
              {...propsAcessibilidade("descricao")}
            />
            <MensagemErro campo="descricao" mensagem={erros.descricao} />
          </div>

          {tipoSelecionado === "SALARIO" && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="receita-competencia" className={classeRotulo}>
                Mês de recebimento *
              </label>
              <input
                id="receita-competencia"
                name="competencia"
                type="month"
                defaultValue={receita?.competencia ?? ""}
                className={`h-12 ${classeCampo(Boolean(erros.competencia))}`}
                {...propsAcessibilidade("competencia")}
              />
              <MensagemErro campo="competencia" mensagem={erros.competencia} />
            </div>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="mt-1 h-12 w-full rounded-2xl bg-primaria text-sm font-medium text-white hover:bg-primaria-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? "Salvando…" : "Salvar"}
          </button>
        </form>
      </div>
    </dialog>
  );
}
