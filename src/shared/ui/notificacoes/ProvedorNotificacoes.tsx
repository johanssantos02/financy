"use client";

import { Toaster } from "react-hot-toast";

export default function ProvedorNotificacoes() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: "var(--bg-cards)",
          color: "var(--texto-principal)",
          border: "1px solid var(--borda)",
        },
        success: { iconTheme: { primary: "var(--primaria)", secondary: "var(--bg-cards)" } },
        error: { iconTheme: { primary: "var(--perigo)", secondary: "var(--bg-cards)" } },
      }}
    />
  );
}
