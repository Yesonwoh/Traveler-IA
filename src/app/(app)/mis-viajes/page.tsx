import { Compass } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EstadoVacio } from "@/components/estado-vacio";
import { leerPerfil } from "@/lib/supabase/perfil";
import { capitalizar } from "@/lib/utils";
import { CrearViajeDialog } from "./crear-viaje-dialog";
import { RetomarIdea } from "./retomar-idea";
import { TripCard } from "./trip-card";

export default async function MisViajesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // prellenamos el formulario con lo que el usuario ya guardó en configuración
  const profile = await leerPerfil<{ ubicacion: string | null; intereses?: string[] | null }>(
    supabase,
    user!.id,
    "ubicacion, intereses",
    "ubicacion"
  );

  const { data: viajes } = await supabase
    .from("viajes")
    .select("id, nombre_del_viaje, foto_portada_url, es_favorito")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl">
      <RetomarIdea />

      <h1 className="text-2xl font-bold text-stone-900">Mis viajes</h1>
      <p className="mt-1 text-stone-500">
        Cada viaje tiene su propia IA, sus favoritos y sus reservas.
      </p>

      <div className="mt-6">
        <CrearViajeDialog
          origenPorDefecto={capitalizar(profile?.ubicacion ?? "")}
          interesesPorDefecto={profile?.intereses ?? []}
        />
      </div>

      {viajes && viajes.length > 0 ? (
        /* Rejilla normal alineada a la izquierda: la de antes centraba las columnas y
           dejaba la última tarjeta huérfana en mitad de la fila. */
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {viajes.map((v) => (
            <TripCard
              key={v.id}
              id={v.id}
              nombre={v.nombre_del_viaje}
              fotoPortadaUrl={v.foto_portada_url}
              esFavorito={v.es_favorito}
            />
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EstadoVacio
            icono={Compass}
            titulo="Todavía no tienes ningún viaje"
            texto="Empieza por “Nuevo viaje” ahí arriba: con el destino (o sin él) la IA te monta la primera propuesta."
          />
        </div>
      )}
    </div>
  );
}
