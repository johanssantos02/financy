import type { ReactNode } from "react";
import { NavbarRodape } from "@/src/widgets/navbar-rodape";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full pb-[calc(64px+env(safe-area-inset-bottom))]">
      {children}
      <NavbarRodape />
    </div>
  );
}
