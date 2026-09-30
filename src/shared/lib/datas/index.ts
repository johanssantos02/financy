// Datas civis circulam como strings "AAAA-MM-DD" e competências como "AAAA-MM",
// evitando deslocamentos de fuso ao converter para Date.

const FUSO_HORARIO = "America/Sao_Paulo";
const MS_POR_DIA = 86_400_000;

const formatadorDataCivil = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO_HORARIO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const doisDigitos = (n: number) => String(n).padStart(2, "0");

export const hojeEmSaoPaulo = (agora: Date = new Date()): string =>
  formatadorDataCivil.format(agora);

export const competenciaDe = (data: string): string => data.slice(0, 7);

export const competenciaAtual = (agora: Date = new Date()): string =>
  competenciaDe(hojeEmSaoPaulo(agora));

export const ehCompetenciaValida = (valor: string): boolean =>
  /^\d{4}-(0[1-9]|1[0-2])$/.test(valor);

const partesCompetencia = (competencia: string) => {
  const [ano, mes] = competencia.split("-").map(Number);
  return { ano, mes };
};

export const ultimoDiaDoMes = (competencia: string): number => {
  const { ano, mes } = partesCompetencia(competencia);
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
};

export const ehDataValida = (valor: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const competencia = competenciaDe(valor);
  if (!ehCompetenciaValida(competencia)) return false;
  const dia = Number(valor.slice(8, 10));
  return dia >= 1 && dia <= ultimoDiaDoMes(competencia);
};

const paraMsUtc = (data: string) => Date.parse(`${data}T00:00:00.000Z`);

export const diferencaEmDias = (de: string, ate: string): number =>
  Math.round((paraMsUtc(ate) - paraMsUtc(de)) / MS_POR_DIA);

export const somarMeses = (competencia: string, meses: number): string => {
  const { ano, mes } = partesCompetencia(competencia);
  const total = ano * 12 + (mes - 1) + meses;
  return `${Math.floor(total / 12)}-${doisDigitos((total % 12) + 1)}`;
};

export const inicioDaCompetencia = (competencia: string): string => `${competencia}-01`;

export const fimDaCompetencia = (competencia: string): string =>
  `${competencia}-${doisDigitos(ultimoDiaDoMes(competencia))}`;

export const montarData = (competencia: string, dia: number): string =>
  `${competencia}-${doisDigitos(dia)}`;

export const paraDataBanco = (data: string): Date => new Date(`${data}T00:00:00.000Z`);

export const deDataBanco = (data: Date): string => data.toISOString().slice(0, 10);
