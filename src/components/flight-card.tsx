"use client";

import { ExternalLink, Plane } from "lucide-react";
import type { VueloDTO } from "@/lib/travelpayouts/vuelos";

export function FlightCard({
  vuelo,
  badge,
  nota,
}: {
  vuelo: VueloDTO;
  /** Etiqueta destacada arriba: "Más barato", "Directo"... */
  badge?: string;
  /** Frase explicativa bajo la tarjeta, al estilo "por 9€ más vuelves por la tarde". */
  nota?: string;
}) {
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
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-brand px-4 text-xs font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Continuar <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* el hueco se reserva siempre para que todas las tarjetas midan lo mismo */}
      <p className="mt-2 min-h-8 px-1 text-xs italic leading-snug text-stone-500">{nota}</p>
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
