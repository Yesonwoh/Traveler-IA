"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Star, Trash2 } from "lucide-react";
import { toggleFavoritoViaje, eliminarViaje } from "@/actions/viajes";
import { cn } from "@/lib/utils";

export function TripCard({
  id,
  nombre,
  fotoPortadaUrl,
  esFavorito,
}: {
  id: string;
  nombre: string;
  fotoPortadaUrl: string | null;
  esFavorito: boolean;
}) {
  const [favorito, setFavorito] = useState(esFavorito);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/viaje/${id}/chat`}>
        {/* overflow-hidden: al hacer zoom la foto crecía por debajo y asomaba bajo la onda. */}
        <div className="relative overflow-hidden">
          <div
            className="h-36 w-full bg-gradient-to-br from-brand to-brand-dark bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
            style={fotoPortadaUrl ? { backgroundImage: `url(${fotoPortadaUrl})` } : undefined}
          />
          {/* Borde ondulado: la onda es blanca y "muerde" la foto, uniendo imagen y título. */}
          <svg
            aria-hidden
            viewBox="0 0 400 24"
            preserveAspectRatio="none"
            className="absolute inset-x-0 -bottom-px h-6 w-full text-white"
          >
            <path
              d="M0,14 C55,26 110,2 200,11 C290,20 345,3 400,13 L400,24 L0,24 Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="px-4 pb-4 pt-1">
          <p className="truncate font-semibold text-stone-900">{nombre}</p>
        </div>
      </Link>

      <button
        aria-label={favorito ? `Quitar ${nombre} de favoritos` : `Marcar ${nombre} como favorito`}
        aria-pressed={favorito}
        onClick={() => {
          setFavorito((v) => !v);
          startTransition(() => toggleFavoritoViaje(id, favorito));
        }}
        disabled={isPending}
        className="absolute right-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/90 text-stone-500 shadow hover:text-brand"
      >
        <Star size={16} className={cn(favorito && "fill-brand text-brand")} />
      </button>

      <button
        aria-label={`Eliminar el viaje ${nombre}`}
        onClick={() => {
          if (confirm(`¿Eliminar "${nombre}"? No se puede deshacer.`)) {
            startTransition(() => eliminarViaje(id));
          }
        }}
        className="absolute left-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/90 text-stone-500 opacity-0 shadow transition-opacity hover:text-red-600 group-hover:opacity-100"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
