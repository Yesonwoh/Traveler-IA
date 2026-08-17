"use client";

import { useState, useTransition } from "react";
import { Check, ExternalLink, Plane, TriangleAlert } from "lucide-react";
import { guardarVuelo } from "@/actions/reservas";
import type { VueloDTO } from "@/lib/travelpayouts/vuelos";

export function FlightCard({
  vuelo,
  viajeId,
  badge,
  nota,
}: {
  vuelo: VueloDTO;
  /** Viaje al que se anota la tarifa al continuar. */
  viajeId: string;
  /** Etiqueta destacada arriba: "Más barato", "Directo"... */
  badge?: string;
  /** Frase explicativa bajo la tarjeta, al estilo "por 9€ más vuelves por la tarde". */
  nota?: string;
}) {
  const [estado, setEstado] = useState<"nada" | "guardado" | "fallo">("nada");
  const [, startTransition] = useTransition();

  /**
   * Continuar hace dos cosas: abrir el buscador (que es lo que pidió el usuario y donde
   * está la comisión) y dejar el vuelo anotado en el viaje.
   *
   * No se espera a que termine el guardado ni se toca el evento: el enlace tiene que
   * abrir la pestaña dentro del mismo gesto o el navegador lo trata como un popup y lo
   * bloquea. Como la página actual no navega —el enlace es target="_blank"—, la acción
   * de servidor termina tranquilamente después.
   */
  function guardar() {
    setEstado("guardado");
    startTransition(async () => {
      try {
        await guardarVuelo({
          viajeId,
          vuelo: {
            aerolineaNombre: vuelo.aerolineaNombre,
            numeroVuelo: vuelo.numeroVuelo,
            origenIata: vuelo.origenIata,
            destinoIata: vuelo.destinoIata,
            salida: vuelo.salida,
            precio: vuelo.precio,
            urlReserva: vuelo.urlReserva,
          },
        });
      } catch {
        // No se interrumpe a quien ya está en Aviasales con una alerta, pero tampoco se
        // finge que ha ido bien: al volver a esta pestaña se encuentra el fallo dicho y
        // un botón para reintentarlo. El motivo real queda en el registro del servidor.
        setEstado("fallo");
      }
    });
  }

  function alContinuar() {
    if (estado === "guardado") return;
    guardar();
  }

  return (
    <div className="flex w-[78vw] shrink-0 snap-center flex-col sm:w-72">
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center gap-1.5 px-3 pt-3">
          {badge && (
            <span className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-semibold text-brand-dark">
              {badge}
            </span>
          )}
          <span className="rounded-full border border-stone-200 px-2 py-0.5 text-[11px] font-medium text-stone-500">
            {vuelo.escalas === 0
              ? "Sin escalas"
              : `${vuelo.escalas} escala${vuelo.escalas > 1 ? "s" : ""}`}
          </span>
          {vuelo.esLowcost && (
            <span className="rounded-full border border-stone-200 px-2 py-0.5 text-[11px] font-medium text-stone-500">
              Low cost
            </span>
          )}
        </div>

        <div className="px-3 pb-1 pt-2">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-stone-900">
            {vuelo.origenIata}
            <Plane size={13} className="shrink-0 text-stone-500" />
            {vuelo.destinoIata}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">
            {formatearFecha(vuelo.salida)}
            {vuelo.vuelta && ` – ${formatearFecha(vuelo.vuelta)}`}
          </p>
        </div>

        <Tramo
          logoUrl={vuelo.logoUrl}
          aerolinea={vuelo.aerolineaNombre}
          numeroVuelo={vuelo.numeroVuelo}
          hora={vuelo.salida}
          desde={vuelo.origenIata}
          hasta={vuelo.destinoIata}
          duracionMin={vuelo.duracionIdaMin}
        />
        {vuelo.vuelta && (
          <Tramo
            logoUrl={vuelo.logoUrl}
            aerolinea={vuelo.aerolineaNombre}
            numeroVuelo={null}
            hora={vuelo.vuelta}
            desde={vuelo.destinoIata}
            hasta={vuelo.origenIata}
          />
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-stone-100 p-3">
          <div>
            {/* La Data API de Travelpayouts sirve tarifas cacheadas: el precio final
                lo fija el buscador. Se presenta como orientativo a propósito. */}
            <p className="text-[11px] leading-none text-stone-500">precio orientativo</p>
            <p className="text-lg font-bold leading-tight text-stone-900">
              desde {formatearPrecio(vuelo.precio, vuelo.moneda)}
            </p>
          </div>
          <a
            href={vuelo.urlReserva}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={alContinuar}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-brand px-4 text-xs font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Continuar <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* el hueco se reserva siempre para que todas las tarjetas midan lo mismo */}
      {estado === "guardado" && (
        <p className="mt-2 flex min-h-8 items-start gap-1.5 px-1 text-xs font-medium leading-snug text-emerald-700">
          <Check size={13} strokeWidth={2.5} className="mt-px shrink-0" aria-hidden />
          Guardado en tus vuelos
        </p>
      )}

      {estado === "fallo" && (
        <p className="mt-2 flex min-h-8 items-start gap-1.5 px-1 text-xs leading-snug text-red-700">
          <TriangleAlert size={13} strokeWidth={2.5} className="mt-px shrink-0" aria-hidden />
          <span>
            No se ha guardado en el viaje.{" "}
            <button
              type="button"
              onClick={guardar}
              className="cursor-pointer font-semibold underline underline-offset-2 hover:no-underline"
            >
              Reintentar
            </button>
          </span>
        </p>
      )}

      {estado === "nada" && (
        <p className="mt-2 min-h-8 px-1 text-xs italic leading-snug text-stone-500">{nota}</p>
      )}
    </div>
  );
}

function Tramo({
  logoUrl,
  aerolinea,
  numeroVuelo,
  hora,
  desde,
  hasta,
  duracionMin,
}: {
  logoUrl: string;
  aerolinea: string;
  numeroVuelo: string | null;
  hora: string;
  desde: string;
  hasta: string;
  duracionMin?: number | null;
}) {
  return (
    <div className="border-t border-stone-100 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          {/* logo del CDN de Aviasales; si la aerolínea no tiene, el hueco queda vacío */}
          <span
            aria-hidden
            className="h-3.5 w-10 shrink-0 bg-contain bg-left bg-no-repeat"
            style={{ backgroundImage: `url(${logoUrl})` }}
          />
          <span className="truncate text-[11px] text-stone-500">{aerolinea}</span>
        </span>
        {numeroVuelo && (
          <span className="shrink-0 text-[11px] text-stone-500">{numeroVuelo}</span>
        )}
      </div>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="text-base font-bold text-stone-900">{desde}</span>
        <span className="flex flex-col items-center">
          <span className="text-sm font-semibold text-stone-700">{formatearHora(hora)}</span>
          {duracionMin ? (
            <span className="text-[10px] leading-none text-stone-500">
              {formatearDuracion(duracionMin)}
            </span>
          ) : null}
        </span>
        <span className="text-base font-bold text-stone-900">{hasta}</span>
      </div>
    </div>
  );
}

function formatearDuracion(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto}min`;
  return resto === 0 ? `${horas}h` : `${horas}h ${resto}min`;
}

function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
}

function formatearHora(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function formatearPrecio(precio: number, moneda: string): string {
  try {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: moneda.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(precio);
  } catch {
    return `${Math.round(precio)} €`;
  }
}
