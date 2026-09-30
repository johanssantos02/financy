"use client";

import toast from "react-hot-toast";

import type { Resultado } from "@/src/shared/lib/resultado";

export function notificarResultado<T>(resultado: Resultado<T>, mensagemSucesso: string) {
  if (resultado.sucesso) {
    toast.success(mensagemSucesso);
    return;
  }
  toast.error(resultado.erro.mensagem);
}
