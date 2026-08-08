"use client";

import { MapPin, Bookmark, ExternalLink, Check } from "lucide-react";
import { PhotoCarousel } from "@/components/photo-carousel";
import { Button } from "@/components/ui/button";
import { TIPO_LABEL } from "@/lib/tipo-label";
import { useGuardarRecomendacion } from "@/hooks/use-guardar-recomendacion";
import { cn } from "@/lib/utils";
import type { RecomendacionDTO } from "@/actions/chat";

export function PinDetailCard({
  recomendacion,
  viajeId,
  className,
  photoClassName = "h-48",
}: {
  recomendacion: RecomendacionDTO;
  viajeId: string;
  className?: string;
  photoClassName?: string;
}) {
  const { esReservable, done, bloqueado, isPending, guardar } = useGuardarRecomendacion(
    recomendacion,
    viajeId
  );

  return (
    <div className={cn("overflow-hidden rounded-2xl bg-white shadow-sm", className)}>
      <PhotoCarousel
        fotos={recomendacion.fotosUrls}
        alt={recomendacion.nombre}
        className={cn("w-full", photoClassName)}
      />
      <div className="p-4">
        <span className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-semibold text-brand-dark">
          {TIPO_LABEL[recomendacion.tipo] ?? recomendacion.tipo}
        </span>
        <p className="mt-1.5 text-lg font-bold text-stone-900">{recomendacion.nombre}</p>
        {recomendacion.direccion && (
          <p className="mt-0.5 flex items-start gap-1 text-xs text-stone-500">
            <MapPin size={12} className="mt-0.5 shrink-0" />
            {recomendacion.direccion}
          </p>
        )}
        {recomendacion.opinion && (
          <p className="mt-2 text-sm text-stone-600">{recomendacion.opinion}</p>
        )}
        <Button
          variant={esReservable ? "primary" : "outline"}
          onClick={guardar}
          disabled={isPending || bloqueado}
          className="mt-3 h-10 w-full text-sm"
        >
          {done ? (
            <>
              <Check size={15} /> {esReservable ? "Guardada en Reservas" : "Guardado en Favoritos"}
            </>
          ) : esReservable ? (
            <>
              <ExternalLink size={15} /> Reservar
            </>
          ) : (
            <>
              <Bookmark size={15} /> Guardar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
