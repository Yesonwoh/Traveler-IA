"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Vuelve a la página anterior si se llegó navegando dentro de la app (p. ej. desde
 * el menú de perfil), y si no —enlace directo, pestaña nueva— cae en `destino`.
 */
export function VolverLink({ destino }: { destino: string }) {
  const router = useRouter();

  function onClick() {
    if (window.history.length > 1) router.back();
    else router.push(destino);
  }

  return (
    <button
      onClick={onClick}
      className="flex cursor-pointer items-center gap-1 text-sm text-stone-500 transition-colors hover:text-brand"
    >
      <ArrowLeft size={15} /> Volver
    </button>
  );
}
