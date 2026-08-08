"use client";

import { useTransition } from "react";
import { MapPin, Trash2 } from "lucide-react";
import { eliminarFavorito } from "@/actions/favoritos";
import { cn } from "@/lib/utils";

export type FavoritoDTO = {
  id: string;
  nombre: string;
  direccion: string | null;
};

export function FavoritoCard({
  favorito,
  viajeId,
  active,
  onSelect,
}: {
  favorito: FavoritoDTO;
  viajeId: string;
  active?: boolean;
  onSelect?: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    /* Dos botones hermanos, no uno dentro de otro. Antes la papelera era un
       `<span role="button">` metido en el `<button>` de la tarjeta: HTML inválido, y
       como un span no entra en el orden de tabulación, quitar un favorito no se podía
       hacer con el teclado. */
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-xl border bg-white transition-colors",
        active ? "border-brand ring-1 ring-brand" : "border-stone-200 hover:border-stone-300"
      )}
    >
      <button
        onClick={onSelect}
        className="min-w-0 flex-1 cursor-pointer rounded-l-xl p-4 text-left"
      >
        <p className="font-medium text-stone-900">{favorito.nombre}</p>
        {favorito.direccion && (
          <p className="mt-1 flex items-start gap-1 text-xs text-stone-500">
            <MapPin size={12} className="mt-0.5 shrink-0" />
            {favorito.direccion}
          </p>
        )}
      </button>
      <button
        type="button"
        aria-label={`Quitar ${favorito.nombre} de favoritos`}
        disabled={isPending}
        onClick={() => startTransition(() => eliminarFavorito(favorito.id, viajeId))}
        className="mr-4 mt-4 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-stone-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
