import Link from "next/link";
import type { LucideIcon } from "lucide-react";

/**
 * Bloque compartido para "aquí todavía no hay nada".
 *
 * Antes cada pestaña se lo pintaba a mano: cuatro recuadros de borde discontinuo con
 * un párrafo suelto en `text-stone-400` (2,5:1, por debajo del mínimo legible) y sin
 * ninguna forma de llegar a la acción que los llena. Mismo esqueleto que `MapaVacio`
 * en trip-map.tsx: icono, una línea que dice qué va a aparecer aquí, y el porqué.
 */
export function EstadoVacio({
  icono: Icono,
  titulo,
  texto,
  accion,
}: {
  icono: LucideIcon;
  titulo: string;
  texto: string;
  /** Enlace a la pantalla donde de verdad se crea lo que falta. */
  accion?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 px-8 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light">
        <Icono size={24} strokeWidth={2} className="text-brand-dark" aria-hidden />
      </div>
      <p className="text-base font-bold text-stone-700">{titulo}</p>
      <p className="max-w-sm text-pretty text-sm leading-relaxed text-stone-500">{texto}</p>
      {accion && (
        <Link
          href={accion.href}
          className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          {accion.label}
        </Link>
      )}
    </div>
  );
}
