"use client";

import { useState, useTransition } from "react";
import { Search, Loader2, PlaneTakeoff, TriangleAlert } from "lucide-react";
import { buscarVuelosViaje, type ResultadoBusqueda } from "@/actions/vuelos";
import { Carousel } from "@/components/carousel";
import { FlightCard } from "@/components/flight-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BuscadorVuelos({
  viajeId,
  origenInicial,
  destinoInicial,
  fechaIdaInicial,
  fechaVueltaInicial,
  viajeros,
}: {
  viajeId: string;
  origenInicial: string;
  destinoInicial: string;
  fechaIdaInicial: string;
  fechaVueltaInicial: string;
  viajeros: number;
}) {
  const [origen, setOrigen] = useState(origenInicial);
  const [destino, setDestino] = useState(destinoInicial);
  const [fechaIda, setFechaIda] = useState(fechaIdaInicial);
  const [fechaVuelta, setFechaVuelta] = useState(fechaVueltaInicial);
  const [soloDirectos, setSoloDirectos] = useState(false);
  const [resultado, setResultado] = useState<ResultadoBusqueda | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending) return;
    startTransition(async () => {
      const res = await buscarVuelosViaje({
        viajeId,
        origen,
        destino,
        fechaIda,
        fechaVuelta,
        soloDirectos,
        viajeros,
      });
      setResultado(res);
    });
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Campo label="Desde">
            <Input value={origen} onChange={(e) => setOrigen(e.target.value)} placeholder="Ej: Madrid" />
          </Campo>
          <Campo label="Hasta">
            <Input
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              placeholder="Ej: Oporto"
            />
          </Campo>
          <Campo label="Ida">
            <Input type="date" value={fechaIda} onChange={(e) => setFechaIda(e.target.value)} />
          </Campo>
          <Campo label="Vuelta">
            <Input
              type="date"
              value={fechaVuelta}
              min={fechaIda || undefined}
              onChange={(e) => setFechaVuelta(e.target.value)}
            />
          </Campo>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={soloDirectos}
              onChange={(e) => setSoloDirectos(e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-[var(--brand)]"
            />
            Solo vuelos directos
          </label>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Buscando...
              </>
            ) : (
              <>
                <Search size={16} /> Buscar vuelos
              </>
            )}
          </Button>
        </div>
      </form>

      {resultado && <Resultados resultado={resultado} />}
    </div>
  );
}

function Resultados({ resultado }: { resultado: ResultadoBusqueda }) {
  if (resultado.estado === "sin-credenciales") {
    return (
      <Aviso>
        La búsqueda de vuelos aún no está conectada. Falta añadir <code>TRAVELPAYOUT_API_KEY</code>{" "}
        y <code>TRAVELPAYOUT_MARKER</code> en el entorno.
      </Aviso>
    );
  }

  if (resultado.estado === "error") {
    return <Aviso>{resultado.mensaje}</Aviso>;
  }

  if (resultado.vuelos.length === 0) {
    return (
      <Aviso>
        No hay tarifas guardadas para esa ruta y esas fechas. Prueba con fechas distintas o quita el
        filtro de vuelos directos.
      </Aviso>
    );
  }

  const masBarato = resultado.vuelos[0];

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-stone-700">
        <PlaneTakeoff size={15} className="text-brand" />
        {resultado.vuelos.length} opciones para {resultado.origenIata} → {resultado.destinoIata}
      </p>

      <Carousel sangradoMovil={false}>
        {resultado.vuelos.map((v) => (
          <FlightCard
            key={v.id}
            vuelo={v}
            badge={v.id === masBarato.id ? "Más barato" : undefined}
            nota={
              v.id === masBarato.id
                ? "La tarifa más baja encontrada para estas fechas."
                : undefined
            }
          />
        ))}
      </Carousel>

      <p className="mt-3 text-xs leading-relaxed text-stone-500">
        Precios encontrados recientemente por otros viajeros, no una cotización en vivo: el importe
        definitivo lo fija el buscador al continuar. Los enlaces son de afiliado.
      </p>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-stone-700">{label}</label>
      {children}
    </div>
  );
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      <TriangleAlert size={16} className="mt-0.5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
