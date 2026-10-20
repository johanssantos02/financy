"use client";

import type { ResumoTag } from "@/src/entities/tag";

type Props = {
  tags: ResumoTag[];
  valorInicial?: string | null;
  comErro?: boolean;
  idAcessibilidade?: string;
  descricaoAcessibilidade?: string;
};

export default function SeletorTag({
  tags,
  valorInicial,
  comErro,
  idAcessibilidade = "gasto-tagId",
  descricaoAcessibilidade,
}: Props) {
  if (tags.length === 0) {
    return (
      <p className="text-sm text-texto-sec">
        Nenhuma categoria disponível para este tipo de gasto.
      </p>
    );
  }

  return (
    <select
      id={idAcessibilidade}
      name="tagId"
      defaultValue={valorInicial ?? ""}
      className={`h-11 w-full rounded-xl border bg-card px-3 text-texto focus:outline-none focus:ring-2 ${
        comErro ? "border-perigo focus:ring-perigo" : "border-borda focus:ring-primaria"
      }`}
      aria-invalid={comErro ? true : undefined}
      aria-describedby={
        comErro
          ? `${idAcessibilidade}-erro`
          : descricaoAcessibilidade
            ? `${idAcessibilidade}-desc`
            : undefined
      }
    >
      <option value="">Sem categoria</option>
      {tags.map((tag) => (
        <option key={tag.id} value={tag.id}>
          {tag.nome}
        </option>
      ))}
    </select>
  );
}
