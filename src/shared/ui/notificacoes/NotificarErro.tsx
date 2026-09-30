"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";

import type { ErroAplicacao } from "@/src/shared/lib/resultado";

export default function NotificarErro({ erro }: { erro: ErroAplicacao }) {
  useEffect(() => {
    toast.error(erro.mensagem, { id: `${erro.tipo}-${erro.mensagem}` });
  }, [erro.tipo, erro.mensagem]);

  return null;
}
