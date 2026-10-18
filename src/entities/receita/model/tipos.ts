export type TipoReceita = "SALARIO" | "OUTRO";

export type ResumoReceita = {
  id: string;
  valor: string;
  tipo: TipoReceita;
  descricao: string | null;
  competencia: string | null;
};

export type DetalheReceita = ResumoReceita;
