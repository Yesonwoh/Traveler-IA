"use client";

import { useState } from "react";
import { FavoritoCard, type FavoritoDTO } from "@/components/favorito-card";
import { PinDetailCard } from "@/components/pin-detail-card";
import { MapPinPanel } from "@/components/map-pin-panel";
import { TripMap, type PuntoMapa } from "@/components/trip-map";
import { usePunteroTactil } from "@/hooks/use-puntero-tactil";
import { cn } from "@/lib/utils";
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
  const [pinTocadoId, setPinTocadoId] = useState<string | null>(null);
  const tactil = usePunteroTactil();

  const pinTocado = pinTocadoId ? puntos.find((p) => p.id === pinTocadoId) : null;

  /**
   * Misma tarjeta que en el mapa del chat. Antes no se pasaba `renderContent`, así que
   * TripMap caía a su bloque de texto por defecto y el mapa de favoritos enseñaba solo
   * el nombre y la dirección.
   *
   * `enPanel` distingue los dos envoltorios que la enseñan: la ventanita flotante del
   * ratón, que se ajusta a un ancho fijo, y el cajón del móvil, que ocupa el ancho del
   * mapa y necesita sombra propia para despegarse de él.
   */
  function tarjetaPunto(p: PuntoMapa, enPanel: boolean) {
    const recomendacion = recomendaciones[p.id];

    // favoritos guardados a mano, sin recomendación detrás
    if (!recomendacion) {
      return (
        <div
          className={cn(
            "bg-white p-3",
            enPanel ? "rounded-2xl shadow-2xl" : "w-56"
          )}
        >
          <p className="font-semibold text-stone-900">{p.nombre}</p>
          {p.direccion && <p className="mt-1 text-xs text-stone-500">{p.direccion}</p>}
        </div>
      );
    }

    return (
      <PinDetailCard
        recomendacion={recomendacion}
        viajeId={viajeId}
        className={enPanel ? "shadow-2xl" : "w-72"}
        photoClassName="h-40"
      />
    );
  }

  function alTocarPin(p: PuntoMapa) {
    setPinTocadoId(p.id);
    // el mapa se centra en él y su tarjeta de la lista queda marcada, igual que si se
    // hubiera elegido desde la lista
    setSelectedId(p.id);
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
            onSelect={() => {
              setSelectedId(f.id);
              setPinTocadoId(null);
            }}
          />
        ))}
      </div>
      {/* En móvil el mapa tiene que dar de sí para que el cajón del punto quepa encima sin
          taparlo entero: con los 16rem de antes la tarjeta con foto no entraba. En
          escritorio manda `lg:h-auto`, donde el detalle sale flotando al pasar el ratón y
          no ocupa sitio. */}
      <div className="relative h-[26rem] overflow-hidden rounded-2xl border border-stone-200 lg:h-auto lg:min-h-[600px]">
        <TripMap
          puntos={puntos}
          focusedId={selectedId}
          // Con el dedo no hay "pasar por encima", así que la ventanita flotante no se
          // abría nunca y tocar un pin no hacía nada: en táctil se cambia por el cajón de
          // abajo, que es lo que ya hacía el mapa del chat.
          renderContent={tactil ? undefined : (p) => tarjetaPunto(p, false)}
          showHoverCard={!tactil}
          onPuntoClick={tactil ? alTocarPin : undefined}
        />
        {pinTocado && (
          // `key` para que al saltar de un pin a otro el cajón vuelva a entrar animado
          // en vez de cambiar el contenido de golpe
          <MapPinPanel key={pinTocado.id} onClose={() => setPinTocadoId(null)}>
            {tarjetaPunto(pinTocado, true)}
          </MapPinPanel>
        )}
      </div>
    </div>
  );
}
