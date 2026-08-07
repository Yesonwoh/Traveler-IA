import { createClient } from "@/lib/supabase/server";
import type { MensajeDTO } from "@/actions/chat";
import { GuardadosProvider } from "@/components/guardados-provider";
import { tieneProveedorReal, type TipoRecomendacion } from "@/lib/affiliates/links";
import { ChatView } from "./chat-view";
import { normalizarFotos } from "@/lib/google/places-photo";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user!.id)
    .single();
  const isPremium = profile?.subscription_status === "premium";

  // datos del formulario inicial: alimentan la tarjeta de vuelos dentro del chat
  const { data: viaje } = await supabase
    .from("viajes")
    .select("origen, destino, fecha_ida, fecha_vuelta, viajeros")
    .eq("id", id)
    .single<{
      origen: string | null;
      destino: string | null;
      fecha_ida: string | null;
      fecha_vuelta: string | null;
      viajeros: number | null;
    }>();

  const ruta =
    viaje?.origen && viaje?.destino
      ? {
          origen: viaje.origen,
          destino: viaje.destino,
          fechaIda: viaje.fecha_ida ?? "",
          fechaVuelta: viaje.fecha_vuelta ?? "",
          viajeros: viaje.viajeros ?? 1,
        }
      : null;

  const { data: mensajes } = await supabase
    .from("mensajes")
    .select(
      "id, texto, es_ia, created_at, recomendaciones(id, tipo, nombre, direccion, opinion, lat, lng, country_code, fotos_urls)"
    )
    .eq("viaje_id", id)
    .order("created_at", { ascending: true });

  const mensajesIniciales: MensajeDTO[] = (mensajes ?? []).map((m) => ({
    id: m.id,
    texto: m.texto,
    esIA: m.es_ia,
    createdAt: m.created_at,
    recomendaciones: (m.recomendaciones ?? []).map((r) => ({
      id: r.id,
      tipo: r.tipo,
      nombre: r.nombre,
      direccion: r.direccion,
      opinion: r.opinion,
      lat: r.lat,
      lng: r.lng,
      countryCode: r.country_code,
      fotosUrls: normalizarFotos(r.fotos_urls),
      // se decide en el servidor: depende de variables de entorno que el cliente no ve
      tieneProveedor: tieneProveedorReal(r.tipo as TipoRecomendacion, r.country_code),
    })),
  }));

  // qué recomendaciones de este viaje ya están guardadas: sin esto, al recargar la
  // página los botones volvían a ofrecer guardar algo que ya estaba guardado
  const [{ data: favoritos }, { data: reservas }] = await Promise.all([
    supabase.from("favoritos").select("recomendacion_id").eq("viaje_id", id),
    supabase.from("reservas").select("recomendacion_id").eq("viaje_id", id),
  ]);

  const guardadas = [...(favoritos ?? []), ...(reservas ?? [])]
    .map((f) => f.recomendacion_id)
    .filter((v): v is string => Boolean(v));

  return (
    <GuardadosProvider iniciales={guardadas}>
      <ChatView
        viajeId={id}
        mensajesIniciales={mensajesIniciales}
        isPremium={isPremium}
        ruta={ruta}
      />
    </GuardadosProvider>
  );
}
