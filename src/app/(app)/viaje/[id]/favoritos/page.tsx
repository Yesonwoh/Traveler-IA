import { createClient } from "@/lib/supabase/server";
import type { PuntoMapa } from "@/components/trip-map";
import type { RecomendacionDTO } from "@/actions/chat";
import { GuardadosProvider } from "@/components/guardados-provider";
import { tieneProveedorReal, type TipoRecomendacion } from "@/lib/affiliates/links";
import { FavoritosView } from "./favoritos-view";

/** Fila de `recomendaciones` unida al favorito, para poder pintar su tarjeta completa. */
type RecomendacionUnida = {
  id: string;
  tipo: string;
  nombre: string;
  direccion: string | null;
  opinion: string | null;
  lat: number | null;
  lng: number | null;
  country_code: string | null;
  fotos_urls: string[] | null;
};

export default async function FavoritosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // se trae la recomendación de origen: el mapa de favoritos enseña la misma tarjeta
  // con foto que el del chat, y para eso hacen falta tipo, opinión y fotos
  const { data } = await supabase
    .from("favoritos")
    .select(
      "id, nombre, direccion, lat, lng, recomendacion_id, recomendaciones(id, tipo, nombre, direccion, opinion, lat, lng, country_code, fotos_urls)"
    )
    .eq("viaje_id", id)
    .order("created_at", { ascending: false });

  const favoritos = data ?? [];

  if (favoritos.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <div className="rounded-2xl border border-dashed border-stone-300 py-16 text-center text-stone-400">
          Todavía no tienes favoritos. Pulsa &quot;Guardar&quot; en una recomendación del chat
          para marcarla.
        </div>
      </div>
    );
  }

  const puntos: PuntoMapa[] = favoritos
    .filter((f) => f.lat != null && f.lng != null)
    .map((f) => ({
      id: f.id,
      lat: f.lat!,
      lng: f.lng!,
      nombre: f.nombre,
      tipo: "favorito",
      direccion: f.direccion,
    }));

  // clave = id del favorito (que es lo que identifica al punto del mapa)
  const recomendaciones: Record<string, RecomendacionDTO> = {};
  for (const f of favoritos) {
    // según cómo infiera la relación el cliente de Supabase, esto llega como objeto
    // o como array de un elemento
    const relacion = f.recomendaciones as unknown as
      | RecomendacionUnida
      | RecomendacionUnida[]
      | null;
    const r = Array.isArray(relacion) ? relacion[0] : relacion;
    if (!r) continue;
    recomendaciones[f.id] = {
      id: r.id,
      tipo: r.tipo,
      nombre: r.nombre,
      direccion: r.direccion,
      opinion: r.opinion,
      lat: r.lat,
      lng: r.lng,
      countryCode: r.country_code,
      fotosUrls: r.fotos_urls ?? [],
      tieneProveedor: tieneProveedorReal(r.tipo as TipoRecomendacion, r.country_code),
    };
  }

  return (
    <GuardadosProvider iniciales={Object.values(recomendaciones).map((r) => r.id)}>
      <FavoritosView
        favoritos={favoritos.map((f) => ({ id: f.id, nombre: f.nombre, direccion: f.direccion }))}
        puntos={puntos}
        recomendaciones={recomendaciones}
        viajeId={id}
      />
    </GuardadosProvider>
  );
}
