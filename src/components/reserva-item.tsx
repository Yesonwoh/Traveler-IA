"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Trash2, Check } from "lucide-react";
import { marcarComoReservado, eliminarReserva } from "@/actions/reservas";
import { cn } from "@/lib/utils";

const PROVEEDOR_LABEL: Record<string, string> = {
  aviasales: "Aviasales",
  hotellook: "Hotellook",
  tiqets: "Tiqets",
  klook: "Klook",
  kkday: "KKday",
  wegotrip: "WeGoTrip",
  gocity: "Go City",
  kiwitaxi: "Kiwitaxi",
  getyourguide: "GetYourGuide",
  otro: "Otro",
  // proveedores anteriores, para las reservas ya guardadas
  kiwi: "Kiwi",
  travelpayouts: "TravelPayouts",
};

export type ReservaDTO = {
  id: string;
  tipo: string;
  nombre: string;
  proveedor: string | null;
  urlAfiliado: string | null;
  estado: string;
  /** Línea de contexto bajo el nombre: en un vuelo, el día de salida y el precio. */
  detalle?: string | null;
};

export function ReservaItem({ reserva, viajeId }: { reserva: ReservaDTO; viajeId: string }) {
  const [estado, setEstado] = useState(reserva.estado);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="truncate font-medium text-stone-900">{reserva.nombre}</p>
        {reserva.detalle && (
          <p className="mt-0.5 truncate text-xs text-stone-500">{reserva.detalle}</p>
        )}
        <div className="mt-1 flex items-center gap-2">
          {reserva.proveedor && (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-500">
              {PROVEEDOR_LABEL[reserva.proveedor] ?? reserva.proveedor}
            </span>
          )}
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              estado === "reservado"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            )}
          >
            {estado === "reservado" ? "Reservado" : "Guardado"}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {reserva.urlAfiliado && (
          <a
            href={reserva.urlAfiliado}
            target="_blank"
            rel="noopener sponsored"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-brand"
            aria-label="Abrir enlace de reserva"
          >
            <ExternalLink size={16} />
          </a>
        )}
        {estado !== "reservado" && (
          <button
            disabled={isPending}
            onClick={() => {
              setEstado("reservado");
              startTransition(() => marcarComoReservado(reserva.id, viajeId));
            }}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-stone-500 hover:bg-emerald-50 hover:text-emerald-600"
            aria-label="Marcar como reservado"
          >
            <Check size={16} />
          </button>
        )}
        <button
          disabled={isPending}
          onClick={() => startTransition(() => eliminarReserva(reserva.id, viajeId))}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-stone-500 hover:bg-red-50 hover:text-red-600"
          aria-label="Eliminar"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
