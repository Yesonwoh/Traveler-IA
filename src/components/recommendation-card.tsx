"use client";

import { MapPin, Bookmark, ExternalLink, Check, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoCarousel } from "@/components/photo-carousel";
import { useGuardarRecomendacion } from "@/hooks/use-guardar-recomendacion";
import { TIPO_LABEL } from "@/lib/tipo-label";
import type { RecomendacionDTO } from "@/actions/chat";

export { TIPO_LABEL };

export function RecommendationCard({
  recomendacion,
  viajeId,
}: {
  recomendacion: RecomendacionDTO;
  viajeId: string;
}) {
  const { esReservable, tieneEntradas, done, bloqueado, isPending, guardar, verEntradas } =
    useGuardarRecomendacion(recomendacion, viajeId);

  return (
    /* El ancho es una fracción exacta del carril, no una medida fija: así entran 2 (o 3)
       tarjetas COMPLETAS y ninguna queda cortada por la mitad al pulsar la flecha. Con
       anchos fijos (w-56/64/72) el carril casi nunca era múltiplo de la tarjeta y siempre
       asomaba media. En móvil sí se deja asomar a propósito, para invitar a deslizar. */
    <div className="flex w-[68vw] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm sm:w-[calc((100%-0.75rem)/2)] lg:w-[calc((100%-1.5rem)/3)]">
      <PhotoCarousel
        fotos={recomendacion.fotosUrls}
        alt={recomendacion.nombre}
        className="h-32 w-full sm:h-36 md:h-40"
      />
      <div className="flex flex-1 flex-col p-3">
        <div className="flex-1">
          <span className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-semibold text-brand-dark">
            {TIPO_LABEL[recomendacion.tipo] ?? recomendacion.tipo}
          </span>
          <p className="mt-1.5 line-clamp-1 text-sm font-semibold text-stone-900">
            {recomendacion.nombre}
          </p>
          {recomendacion.direccion && (
            <p className="mt-0.5 flex items-start gap-1 text-xs text-stone-500">
              <MapPin size={12} className="mt-0.5 shrink-0" />
              <span className="line-clamp-1">{recomendacion.direccion}</span>
            </p>
          )}
        </div>
        <div className="mt-2 flex gap-1.5">
          <Button
            variant={esReservable ? "primary" : "outline"}
            onClick={guardar}
            disabled={isPending || bloqueado}
            className="h-9 min-w-0 flex-1 gap-1 px-2 text-xs"
          >
            {done ? (
              <>
                <Check size={14} /> {esReservable ? "Guardada" : "Guardado"}
              </>
            ) : esReservable ? (
              <>
                <ExternalLink size={14} /> Reservar
              </>
            ) : (
              <>
                <Bookmark size={14} /> Guardar
              </>
            )}
          </Button>

          {/* los monumentos se guardan Y se pueden comprar: son entradas, no reservas */}
          {tieneEntradas && (
            <Button
              variant="primary"
              onClick={verEntradas}
              disabled={isPending}
              className="h-9 min-w-0 flex-1 gap-1 px-2 text-xs"
            >
              <Ticket size={14} /> Entradas
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
