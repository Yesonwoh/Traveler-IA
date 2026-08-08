"use client";

import { useState } from "react";
import { FavoritoCard, type FavoritoDTO } from "@/components/favorito-card";
import { PinDetailCard } from "@/components/pin-detail-card";
import { TripMap, type PuntoMapa } from "@/components/trip-map";
import type { RecomendacionDTO } from "@/actions/chat";

export function FavoritosView({
  favoritos,
  puntos,
  recomendaciones,
  viajeId,
}: {
  favoritos: FavoritoDTO[];
  puntos: PuntoMapa[];
  /** Recomendación de origen de cada favorito, indexada por id de favorito. */
  recomendaciones: Record<string, RecomendacionDTO>;
  viajeId: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /**
   * Misma tarjeta que en el mapa del chat. Antes no se pasaba `renderContent`, así que
   * TripMap caía a su bloque de texto por defecto y el mapa de favoritos enseñaba solo
   * el nombre y la dirección.
   */
  function renderPunto(p: PuntoMapa) {
    const recomendacion = recomendaciones[p.id];
    return recomendacion ? (
      <PinDetailCard
        recomendacion={recomendacion}
        viajeId={viajeId}
        className="w-72"
        photoClassName="h-40"
      />
    ) : (
      // favoritos guardados a mano, sin recomendación detrás
      <div className="w-56 p-3">
        <p className="font-semibold text-stone-900">{p.nombre}</p>
        {p.direccion && <p className="mt-1 text-xs text-stone-500">{p.direccion}</p>}
      </div>
    );
  }

  return (
    <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_560px] 2xl:grid-cols-[minmax(0,1fr)_680px]">
      <div className="space-y-2">
        {favoritos.map((f) => (
          <FavoritoCard
            key={f.id}
            favorito={f}
            viajeId={viajeId}
            active={f.id === selectedId}
            onSelect={() => setSelectedId(f.id)}
          />
        ))}
      </div>
      <div className="h-64 overflow-hidden rounded-2xl border border-stone-200 lg:h-auto lg:min-h-[600px]">
        <TripMap puntos={puntos} focusedId={selectedId} renderContent={renderPunto} />
      </div>
    </div>
  );
}
