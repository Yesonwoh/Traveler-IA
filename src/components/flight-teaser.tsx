"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PlaneTakeoff, ChevronRight, Loader2 } from "lucide-react";
import { buscarVuelosViaje } from "@/actions/vuelos";

/**
 * Versión compacta para el chat: cuando la IA propone un vuelo y el viaje ya tiene
 * ruta, muestra el precio real más bajo y lleva al buscador completo de la pestaña
 * Vuelos. Si no hay tarifas o falta configurar la API, no pinta nada.
 */
export function FlightTeaser({
  viajeId,
  origen,
  destino,
  fechaIda,
  fechaVuelta,
  viajeros,
}: {
  viajeId: string;
  origen: string;
  destino: string;
  fechaIda: string;
  fechaVuelta: string;
  viajeros: number;
}) {
  const [estado, setEstado] = useState<"cargando" | "listo" | "oculto">("cargando");
  const [precio, setPrecio] = useState<string | null>(null);
  const [ruta, setRuta] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    buscarVuelosViaje({ viajeId, origen, destino, fechaIda, fechaVuelta, soloDirectos: false, viajeros })
      .then((res) => {
        if (cancelado) return;
        if (res.estado !== "ok" || res.vuelos.length === 0) {
          setEstado("oculto");
          return;
        }
        const barato = res.vuelos[0];
        setPrecio(
          new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: barato.moneda.toUpperCase(),
            maximumFractionDigits: 0,
          }).format(barato.precio)
        );
        setRuta(`${res.origenIata} → ${res.destinoIata}`);
        setEstado("listo");
      })
      .catch(() => !cancelado && setEstado("oculto"));

    return () => {
      cancelado = true;
    };
  }, [viajeId, origen, destino, fechaIda, fechaVuelta, viajeros]);

  if (estado === "oculto") return null;

  if (estado === "cargando") {
    return (
      <p className="mt-3 flex items-center gap-2 text-xs text-stone-500">
        <Loader2 size={13} className="animate-spin" /> Buscando precios de vuelo...
      </p>
    );
  }

  return (
    <Link
      href={`/viaje/${viajeId}/vuelos`}
      className="mt-3 flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3 transition-colors hover:border-brand hover:bg-brand-light/40"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
        <PlaneTakeoff size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-stone-900">
          Vuelos {ruta} desde {precio}
        </span>
        <span className="block text-xs text-stone-500">
          Precio orientativo. Ver opciones y horarios
        </span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-stone-300" />
    </Link>
  );
}
