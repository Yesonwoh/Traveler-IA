import { createClient } from "@/lib/supabase/server";
import { ReservaItem, type ReservaDTO } from "@/components/reserva-item";

const GRUPOS: { tipo: string; titulo: string }[] = [
  { tipo: "vuelo", titulo: "Vuelos" },
  { tipo: "alojamiento", titulo: "Alojamiento" },
  { tipo: "actividad", titulo: "Actividades" },
  { tipo: "transporte", titulo: "Transporte" },
  { tipo: "otro", titulo: "Otros" },
];

export default async function ReservasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("reservas")
    .select("id, tipo, nombre, proveedor, url_afiliado, estado")
    .eq("viaje_id", id)
    .order("created_at", { ascending: false });

  const reservas: ReservaDTO[] = (data ?? []).map((r) => ({
    id: r.id,
    tipo: r.tipo,
    nombre: r.nombre,
    proveedor: r.proveedor,
    urlAfiliado: r.url_afiliado,
    estado: r.estado,
  }));

  if (reservas.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <div className="rounded-2xl border border-dashed border-stone-300 py-16 text-center text-stone-400">
          Todavía no has guardado ninguna reserva. Pulsa &quot;Reservar&quot; en una
          recomendación del chat para que aparezca aquí.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-6">
      {GRUPOS.map(({ tipo, titulo }) => {
        const items = reservas.filter((r) => r.tipo === tipo);
        if (items.length === 0) return null;
        return (
          <section key={tipo}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
              {titulo}
            </h2>
            <div className="space-y-2">
              {items.map((r) => (
                <ReservaItem key={r.id} reserva={r} viajeId={id} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
