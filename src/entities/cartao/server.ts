// Ponto de entrada exclusivo do servidor: acesso a dados não deve ser importado por
// Client Components, por isso fica fora do index.ts.
export { existeNomeCartao, listarCartoes, obterCartaoPorId } from "./api/consultas";
