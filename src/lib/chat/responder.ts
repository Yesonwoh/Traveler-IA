import { createClient } from "@/lib/supabase/server";
import { hayNombreEn } from "@/lib/supabase/columnas";
import { generarRespuestaIA, extraerCiudad, type HistorialMensaje } from "@/lib/ai/travelerAI";
import { PRIMERA_IMPRESION, pruebaGratisPrompt } from "@/lib/ai/prompts";
import { DIAS_PRUEBA, hayColumnasPrueba } from "@/lib/suscripcion/prueba";
import { geocodeDireccion } from "@/lib/google/geocode";
import { buscarFotoUnsplash } from "@/lib/unsplash";
import { buscarFotosLugar, normalizarFotos } from "@/lib/google/places-photo";
import { construirContextoUsuario } from "@/lib/preferencias";
import { leerPerfil } from "@/lib/supabase/perfil";
import type { MensajeDTO, RecomendacionDTO } from "@/lib/chat/tipos";

/** Columnas del perfil que alimentan el contexto de la IA. */
export const PERFIL_COLUMNS =
  "subscription_status, contador_mensajes, ubicacion, fecha_nacimiento, intereses, presupuesto_estilo, tipo_alojamiento, ritmo_viaje, notas_viaje";

type PerfilRow = {
  subscription_status?: string | null;
  trial_used?: boolean | null;
  contador_mensajes?: number | null;
  ubicacion?: string | null;
  fecha_nacimiento?: string | null;
  intereses?: string[] | null;
  presupuesto_estilo?: string | null;
  tipo_alojamiento?: string | null;
  ritmo_viaje?: string | null;
  notas_viaje?: string | null;
};

/**
 * Aeropuertos, estaciones y traslados: son puntos de tránsito, no sitios que visitar.
 * Como tarjeta quedan igual que un monumento (foto, opinión, botón de Reservar) y el
 * botón no lleva a nada comprable; encima se guardaban en la pestaña de Vuelos como si
 * fueran billetes. Los vuelos se gestionan en su pestaña, no en el mapa del chat.
 */
const ES_TRANSITO =
  /\b(aeropuertos?|airports?|terminal(?:es)?|estaci[oó]n(?:es)?\s+de\s+(?:tren|autobuses|bus)|train\s+station|bus\s+station)\b/i;

export function esPuntoDeTransito(tipo: string, nombre: string): boolean {
  if (tipo === "vuelo") return true;
  return ES_TRANSITO.test(nombre);
}

export function contextoDesdePerfil(profile: PerfilRow | null | undefined): string | null {
  return construirContextoUsuario({
    ubicacion: profile?.ubicacion,
    fechaNacimiento: profile?.fecha_nacimiento,
    intereses: profile?.intereses,
    presupuestoEstilo: profile?.presupuesto_estilo,
    tipoAlojamiento: profile?.tipo_alojamiento,
    ritmoViaje: profile?.ritmo_viaje,
    notasViaje: profile?.notas_viaje,
  });
}

/**
 * Guarda el mensaje del usuario, pide respuesta a la IA y persiste la respuesta
 * con sus recomendaciones (geocodificadas y con fotos). Lo comparten el chat y
 * la creación guiada de viajes.
 */
export async function procesarMensajeIA({
  viajeId,
  userId,
  texto,
  instrucciones,
  portadaAutomatica = true,
}: {
  viajeId: string;
  userId: string;
  texto: string;
  /** Instrucciones extra de sistema para este turno (p. ej. el briefing inicial). */
  instrucciones?: string | null;
  /** Si es el primer mensaje del viaje, resuelve la foto de portada. */
  portadaAutomatica?: boolean;
}): Promise<MensajeDTO> {
  const supabase = await createClient();

  const { error: insertUserError } = await supabase.from("mensajes").insert({
    viaje_id: viajeId,
    user_id: userId,
    texto,
    es_ia: false,
  });
  if (insertUserError) throw new Error("No se pudo guardar el mensaje.");

  // `trial_used` solo se pide si la migración 0011 está aplicada: pedirla antes haría
  // fallar la consulta entera y el chat se quedaría sin contexto de perfil.
  const conColumnasPrueba = await hayColumnasPrueba(supabase);
  const profile = await leerPerfil<PerfilRow>(
    supabase,
    userId,
    conColumnasPrueba ? `${PERFIL_COLUMNS}, trial_used` : PERFIL_COLUMNS,
    "subscription_status, contador_mensajes, ubicacion, fecha_nacimiento"
  );
  const tier = profile?.subscription_status === "premium" ? "premium" : "free";

  // Sin la migración aplicada no hay forma de saber si ya la gastó, así que la IA se
  // calla: mejor no ofrecerla que ofrecérsela dos veces a la misma persona.
  const puedeProbarGratis =
    tier === "free" && conColumnasPrueba && profile?.trial_used !== true;

  const { data: historialRows } = await supabase
    .from("mensajes")
    .select("texto, es_ia")
    .eq("viaje_id", viajeId)
    .order("created_at", { ascending: true })
    .limit(41);

  const historial: HistorialMensaje[] = (historialRows ?? [])
    .slice(0, -1)
    .map((m) => ({ role: m.es_ia ? "assistant" : "user", content: m.texto }));

  const esPrimerMensaje = historial.length === 0;

  /**
   * La primerísima respuesta de esta persona, que es donde nos compara con ChatGPT.
   * `contador_mensajes` se incrementa al final de esta misma función, así que durante
   * el primer mensaje de su primer viaje todavía vale 0: no hace falta contar viajes
   * ni consultar nada más.
   *
   * A quien ya paga no se le toca: su prompt ya hace todo esto y más.
   */
  const esPrimeraImpresion = tier === "free" && (profile?.contador_mensajes ?? 0) === 0;

  const respuesta = await generarRespuestaIA({
    tier,
    historial,
    mensaje: texto,
    contextoUsuario: contextoDesdePerfil(profile),
    // En la primera impresión no se vende nada: se está intentando demostrar que esto
    // sirve, y meter la prueba gratuita en la misma respuesta la convierte en un
    // anuncio. La oferta sigue ahí para el segundo mensaje en adelante.
    promocion: puedeProbarGratis && !esPrimeraImpresion ? pruebaGratisPrompt(DIAS_PRUEBA) : null,
    // El override va el último para que gane al briefing del formulario, que también
    // llega por aquí y también habla del alcance de la respuesta.
    instrucciones: esPrimeraImpresion
      ? [instrucciones, PRIMERA_IMPRESION.prompt].filter(Boolean).join("\n\n")
      : instrucciones,
    modelo: esPrimeraImpresion ? PRIMERA_IMPRESION.model : undefined,
    temperatura: esPrimeraImpresion ? PRIMERA_IMPRESION.temperature : undefined,
  });

  // El prompt prohíbe meter aeropuertos y vuelos en el mapa, pero el modelo se lo salta
  // a veces. Sin este filtro salían tarjetas de "aeropuerto de Roma Fiumicino" con foto
  // y botón de Reservar, que además se guardaban en Vuelos como si fueran billetes.
  // Se descartan aquí, antes de geocodificar, así que también ahorra llamadas a Google.
  const mapa = respuesta.mapa.filter((r) => !esPuntoDeTransito(r.tipo, r.nombre));

  const [coords, fotos] = await Promise.all([
    Promise.all(mapa.map((r) => geocodeDireccion(r.direccion || r.nombre))),
    Promise.all(mapa.map((r) => buscarFotosLugar(r.nombre, r.direccion))),
    esPrimerMensaje && portadaAutomatica
      ? ponerFotoPortada(viajeId, respuesta.chat)
      : Promise.resolve(),
  ]);

  const { data: mensajeIA, error: insertIAError } = await supabase
    .from("mensajes")
    .insert({ viaje_id: viajeId, user_id: userId, texto: respuesta.chat, es_ia: true })
    .select("id, created_at")
    .single();
  if (insertIAError || !mensajeIA) throw new Error("No se pudo guardar la respuesta.");

  let recomendaciones: RecomendacionDTO[] = [];
  if (mapa.length > 0) {
    const conNombreEn = await hayNombreEn(supabase);
    const rows = mapa.map((r, i) => ({
      mensaje_id: mensajeIA.id,
      user_id: userId,
      tipo: r.tipo,
      nombre: r.nombre,
      // solo si la migración 0010 está aplicada: insertar una columna inexistente
      // haría fallar el guardado del mensaje entero
      ...(conNombreEn ? { nombre_en: r.nombre_en || null } : {}),
      direccion: r.direccion || null,
      opinion: r.opinion || null,
      lat: coords[i]?.lat ?? null,
      lng: coords[i]?.lng ?? null,
      country_code: coords[i]?.countryCode ?? null,
      fotos_urls: fotos[i] ?? [],
    }));

    const { data: inserted } = await supabase.from("recomendaciones").insert(rows).select();
    recomendaciones = (inserted ?? []).map((row) => ({
      id: row.id,
      tipo: row.tipo,
      nombre: row.nombre,
      direccion: row.direccion,
      opinion: row.opinion,
      lat: row.lat,
      lng: row.lng,
      countryCode: row.country_code,
      fotosUrls: normalizarFotos(row.fotos_urls),
    }));
  }

  await supabase
    .from("profiles")
    .update({ contador_mensajes: (profile?.contador_mensajes ?? 0) + 1 })
    .eq("id", userId);

  return {
    id: mensajeIA.id,
    texto: respuesta.chat,
    esIA: true,
    createdAt: mensajeIA.created_at,
    recomendaciones,
  };
}

/** Resuelve el destino de una respuesta de la IA y le pone foto de portada al viaje. */
export async function ponerFotoPortada(viajeId: string, textoIA: string, ciudadConocida?: string) {
  try {
    const supabase = await createClient();

    const { data: viaje } = await supabase
      .from("viajes")
      .select("foto_portada_url")
      .eq("id", viajeId)
      .single();
    if (viaje?.foto_portada_url) return;

    const ciudad = ciudadConocida?.trim() || (await extraerCiudad(textoIA));
    if (!ciudad) return;

    const foto = await buscarFotoUnsplash(`${ciudad} travel`);
    if (!foto) return;

    await supabase.from("viajes").update({ foto_portada_url: foto }).eq("id", viajeId);
  } catch {
    // la foto de portada es un extra visual: si falla, el viaje sigue funcionando sin ella
  }
}
