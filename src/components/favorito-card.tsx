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
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full cursor-pointer items-start justify-between gap-3 rounded-xl border bg-white p-4 text-left transition-colors",
        active ? "border-brand ring-1 ring-brand" : "border-stone-200 hover:border-stone-300"
      )}
    >
      <div className="min-w-0">
        <p className="font-medium text-stone-900">{favorito.nombre}</p>
        {favorito.direccion && (
          <p className="mt-1 flex items-start gap-1 text-xs text-stone-400">
            <MapPin size={12} className="mt-0.5 shrink-0" />
            {favorito.direccion}
          </p>
        )}
      </div>
      <span
        role="button"
        aria-label="Quitar de favoritos"
        onClick={(e) => {
          e.stopPropagation();
          startTransition(() => eliminarFavorito(favorito.id, viajeId));
        }}
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 size={16} className={isPending ? "opacity-50" : ""} />
      </span>
    </button>
  );
}
