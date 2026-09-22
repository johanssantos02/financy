import { FormularioEntrar } from "@/src/features/autenticacao/FormularioEntrar";

export const metadata = {
  title: "Entrar | Financy",
};

export default function PaginaLogin() {
  return (
    <div className="w-full max-w-sm md:rounded-2xl md:border md:border-borda md:bg-card md:p-8 md:shadow-sm">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primaria text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" x2="12" y1="2" y2="22" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-texto">Bem-vindo de volta</h1>
        <p className="text-sm text-texto-sec">Entre na sua conta Financy</p>
      </div>

      <FormularioEntrar />
    </div>
  );
}
