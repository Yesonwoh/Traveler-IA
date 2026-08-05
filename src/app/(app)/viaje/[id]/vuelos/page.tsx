import type { ReactNode } from "react";
import { Car, ExternalLink, Luggage } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { linkTrasladoAeropuerto, linkConsignaEquipaje } from "@/lib/affiliates/links";
import { ReservaItem, type ReservaDTO } from "@/components/reserva-item";
import { BuscadorVuelos } from "./buscador-vuelos";

type DatosViaje = {
  origen: string | null;
  destino: string | null;
  fecha_ida: string | null;
  fecha_vuelta: string | null;
  viajeros: number | null;
  nombre_del_viaje: string;
};

export default async function VuelosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // el formulario de creación guarda estos datos; si la migración 0006 no está
  // aplicada el select falla y el buscador simplemente sale vacío
  const { data: viaje } = await supabase
    .from("viajes")
    .select("origen, destino, fecha_ida, fecha_vuelta, viajeros, nombre_del_viaje")
    .eq("id", id)
    .single<DatosViaje>();

  const { data } = await supabase
    .from("reservas")
    .select("id, tipo, nombre, proveedor, url_afiliado, estado")
    .eq("viaje_id", id)
    .eq("tipo", "vuelo")
    .order("created_at", { ascending: false });

  const vuelos: ReservaDTO[] = (data ?? []).map((r) => ({
    id: r.id,
    tipo: r.tipo,
    nombre: r.nombre,
    proveedor: r.proveedor,
    urlAfiliado: r.url_afiliado,
    estado: r.estado,
  }));

  // Kiwitaxi vive aquí y no colgando de una tarjeta de aeropuerto en el chat
  const trasladoUrl = linkTrasladoAeropuerto(viaje?.destino ?? null);
  const consignaUrl = await linkConsignaEquipaje(viaje?.destino ?? null);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <BuscadorVuelos
        viajeId={id}
        origenInicial={viaje?.origen ?? ""}
        destinoInicial={viaje?.destino ?? ""}
        fechaIdaInicial={viaje?.fecha_ida ?? ""}
        fechaVueltaInicial={viaje?.fecha_vuelta ?? ""}
        viajeros={viaje?.viajeros ?? 1}
      />

      {/* Logística de la llegada: lo que necesitas resuelto entre aterrizar y poder
          entrar al alojamiento. Aquí y no en las tarjetas del chat, donde un botón de
          "Reservar" colgado de un aeropuerto no significaba nada. */}
      {(trasladoUrl || consignaUrl) && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400">
            Al aterrizar
          </h2>

          {trasladoUrl && (
            <ServicioLlegada
              href={trasladoUrl}
              icono={<Car size={18} />}
              titulo="Traslado del aeropuerto al centro"
              texto="Precio cerrado y conductor esperando. Compensa si llegáis de noche o sois varios."
            />
          )}

          {consignaUrl && (
            <ServicioLlegada
              href={consignaUrl}
              icono={<Luggage size={18} />}
              titulo="Dejar las maletas antes del check-in"
              texto="El hostal no te deja entrar hasta las 14:00 y tú aterrizas a las 7. Consignas desde 1,60 €/día."
            />
          )}
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Vuelos guardados
        </h2>
        {vuelos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 py-12 text-center text-sm text-stone-400">
            Todavía no has guardado ningún vuelo. Busca arriba tu ruta y pulsa
            &quot;Continuar&quot; en la tarifa que te encaje.
          </div>
        ) : (
          <div className="space-y-2">
            {vuelos.map((r) => (
              <ReservaItem key={r.id} reserva={r} viajeId={id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/** Fila de servicio de llegada: traslado o consigna. */
function ServicioLlegada({
  href,
  icono,
  titulo,
  texto,
}: {
  href: string;
  icono: ReactNode;
  titulo: string;
  texto: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 transition-colors hover:border-brand hover:bg-brand-light/40"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
        {icono}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-stone-900">{titulo}</span>
        <span className="block text-xs leading-relaxed text-stone-500">{texto}</span>
      </span>
      <ExternalLink size={15} className="shrink-0 text-stone-300" />
    </a>
  );
}
