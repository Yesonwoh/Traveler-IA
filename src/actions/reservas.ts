"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hayNombreEn } from "@/lib/supabase/columnas";
import {
  proveedorParaRecomendacion,
  construirLinkAfiliado,
  type TipoRecomendacion,
  type ContextoViaje,
} from "@/lib/affiliates/links";
import type { VueloDTO } from "@/lib/travelpayouts/vuelos";

// tipos que puede traer una recomendación de la IA pero que no son "reservables" tal cual:
// se guardan en reservas como 'actividad'.
function tipoReserva(tipo: TipoRecomendacion): "vuelo" | "alojamiento" | "actividad" | "transporte" | "otro" {
  if (tipo === "monumento" || tipo === "restaurante") return "actividad";
  return tipo;
}

/**
 * Ruta y fechas del viaje, para que el enlace de reserva llegue al buscador ya
 * relleno en vez de a una home genérica. Si la migración 0006 no está aplicada
 * o el viaje se creó antes, se devuelve vacío y el enlace cae al genérico.
 */
async function contextoDelViaje(
  supabase: Awaited<ReturnType<typeof createClient>>,
  viajeId: string
): Promise<ContextoViaje> {
  const { data } = await supabase
    .from("viajes")
    .select("origen_iata, destino_iata, destino, fecha_ida, fecha_vuelta, viajeros")
    .eq("id", viajeId)
    .single<{
      origen_iata: string | null;
      destino_iata: string | null;
      destino: string | null;
      fecha_ida: string | null;
      fecha_vuelta: string | null;
      viajeros: number | null;
    }>();

  return {
    origenIata: data?.origen_iata,
    destinoIata: data?.destino_iata,
    ciudadDestino: data?.destino,
    fechaIda: data?.fecha_ida,
    fechaVuelta: data?.fecha_vuelta,
    viajeros: data?.viajeros,
  };
}

/**
 * Nombre del sitio en inglés, que es como están los catálogos de los proveedores de
 * entradas. Devuelve null si la migración 0010 aún no está aplicada o si la
 * recomendación es anterior a ella: el enlace cae entonces al comportamiento de antes.
 */
async function leerNombreEn(
  supabase: Awaited<ReturnType<typeof createClient>>,
  recomendacionId?: string | null
): Promise<string | null> {
  if (!recomendacionId) return null;
  if (!(await hayNombreEn(supabase))) return null;

  const { data } = await supabase
    .from("recomendaciones")
    .select("nombre_en")
    .eq("id", recomendacionId)
    .maybeSingle<{ nombre_en: string | null }>();

  return data?.nombre_en ?? null;
}

export async function guardarReserva(params: {
  viajeId: string;
  recomendacionId?: string | null;
  tipo: TipoRecomendacion;
  nombre: string;
  direccion?: string | null;
  countryCode?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const proveedor = proveedorParaRecomendacion(params.tipo, params.countryCode ?? null);
  const urlAfiliado = construirLinkAfiliado({
    proveedor,
    nombre: params.nombre,
    // el nombre en inglés se lee aquí y no viaja en el DTO: solo hace falta en este
    // punto, para cruzar el sitio con el catálogo de entradas del proveedor
    nombreEn: await leerNombreEn(supabase, params.recomendacionId),
    direccion: params.direccion ?? undefined,
    contexto: await contextoDelViaje(supabase, params.viajeId),
  });

  // Igual que en favoritos: pulsar "Reservar" dos veces (o recargar entre medias) no
  // debe dejar la misma reserva repetida. Se comprueba antes de insertar para no
  // depender de que la migración 0009 esté ya aplicada. El usuario sí puede volver a
  // abrir el enlace del proveedor: eso no crea una fila nueva.
  if (params.recomendacionId) {
    const { data: existente } = await supabase
      .from("reservas")
      .select("id")
      .eq("viaje_id", params.viajeId)
      .eq("recomendacion_id", params.recomendacionId)
      .maybeSingle();

    if (existente) return { urlAfiliado };
  }

  const { error } = await supabase.from("reservas").insert({
    viaje_id: params.viajeId,
    user_id: user.id,
    recomendacion_id: params.recomendacionId ?? null,
    tipo: tipoReserva(params.tipo),
    nombre: params.nombre,
    proveedor,
    url_afiliado: urlAfiliado,
    estado: "guardado",
  });

  // 23505 = otra pestaña la insertó entre medias: ya está guardada, no es un fallo
  if (error && error.code !== "23505") throw new Error("No se pudo guardar la reserva.");

  revalidatePath(`/viaje/${params.viajeId}/reservas`);
  revalidatePath(`/viaje/${params.viajeId}/vuelos`);

  return { urlAfiliado };
}

/** Lo que hace falta de una tarifa del buscador para dejarla anotada en el viaje. */
export type VueloAGuardar = Pick<
  VueloDTO,
  "aerolineaNombre" | "numeroVuelo" | "origenIata" | "destinoIata" | "salida" | "precio" | "urlReserva"
>;

/**
 * Nombre con el que el vuelo aparece en la pestaña Vuelos: "Ryanair FR1234 · GRX → SVQ".
 * Es además la mitad de su identidad en la base de datos (ver migración 0015), así que
 * cambiar este formato cambia qué cuenta como "el mismo vuelo".
 */
function nombreDelVuelo(vuelo: VueloAGuardar): string {
  const aerolinea = [vuelo.aerolineaNombre, vuelo.numeroVuelo].filter(Boolean).join(" ");
  const ruta = `${vuelo.origenIata} → ${vuelo.destinoIata}`;
  return aerolinea ? `${aerolinea} · ${ruta}` : ruta;
}

/**
 * Anota en el viaje el vuelo que el usuario acaba de abrir en el buscador.
 *
 * OJO con lo que significa esta fila: NO es "el vuelo que compró". El enlace lleva a
 * Aviasales a buscar, y allí puede acabar cogiendo otro, o ninguno — con afiliación no
 * hay forma de enterarse. Por eso entra como 'guardado' y nunca como 'reservado': quien
 * confirma es el usuario, desde el botón de la propia reserva.
 *
 * Hasta ahora la tarjeta del buscador enlazaba fuera sin guardar nada, así que la
 * pestaña Vuelos —que lista reservas de tipo 'vuelo'— estaba permanentemente vacía,
 * aunque su estado vacío prometiera lo contrario.
 */
export async function guardarVuelo(params: { viajeId: string; vuelo: VueloAGuardar }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  // Que el viaje sea suyo. RLS protege la fila que se inserta (lleva su user_id), pero
  // no impide que el viaje_id apunte al viaje de otra persona: es el mismo hueco que ya
  // se cerró al enviar mensajes (ver actions/chat.ts).
  const { data: viaje } = await supabase
    .from("viajes")
    .select("id")
    .eq("id", params.viajeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!viaje) throw new Error("Ese viaje no existe o no es tuyo.");

  const nombre = nombreDelVuelo(params.vuelo);

  // La fecha se guarda tal cual la da la API, sin reconvertirla: `timestamptz` ya la
  // normaliza al parsearla, y hacerlo antes aquí solo añade una conversión donde
  // perder el huso. Cuidado al usar la HORA para algo (el aviso de check-in, por
  // ejemplo): Travelpayouts entrega la salida en hora local del aeropuerto de origen y
  // no siempre marca el desfase, así que hará falta la zona del aeropuerto para
  // interpretarla bien. Por eso la pestaña enseña solo el día, que sí es fiable.
  const fecha = Number.isNaN(new Date(params.vuelo.salida).getTime())
    ? null
    : params.vuelo.salida;

  // El índice único de la 0009 es parcial y solo cubre lo que viene de una
  // recomendación, así que aquí hay que comprobarlo a mano. La 0015 añade el índice
  // que cierra la carrera entre dos pestañas; esto funciona igual sin ella aplicada.
  const consulta = supabase
    .from("reservas")
    .select("id")
    .eq("viaje_id", params.viajeId)
    .eq("tipo", "vuelo")
    .eq("nombre", nombre);

  // `limit(1)` porque hasta que la 0015 se aplique puede haber duplicados de antes, y
  // `maybeSingle` sobre dos filas falla en vez de devolver una: se colaría un tercero.
  const { data: existente } = await (fecha ? consulta.eq("fecha", fecha) : consulta.is("fecha", null))
    .limit(1)
    .maybeSingle();
  if (existente) return;

  const { error } = await supabase.from("reservas").insert({
    viaje_id: params.viajeId,
    user_id: user.id,
    tipo: "vuelo",
    nombre,
    proveedor: "aviasales",
    url_afiliado: params.vuelo.urlReserva,
    estado: "guardado",
    fecha,
    // La búsqueda pide siempre tarifas en euros (ver lib/travelpayouts/vuelos.ts), y la
    // columna no guarda moneda: si algún día se consulta en otra divisa, hay que
    // añadirla antes de tocar esto.
    precio_estimado: params.vuelo.precio,
  });

  // 23505 = otra pestaña lo insertó entre medias: ya está guardado, no es un fallo
  if (error && error.code !== "23505") {
    // Next.js censura el mensaje de cualquier excepción que salga de una Server Action
    // en producción, así que el motivo real solo existe si se registra aquí. Sin esto,
    // un fallo de la base de datos (una restricción, una política) es indistinguible
    // desde fuera de "no pasa nada al pulsar".
    console.error(`[vuelos] no se pudo guardar "${nombre}":`, error.code, error.message);
    throw new Error("No se pudo guardar el vuelo.");
  }

  revalidatePath(`/viaje/${params.viajeId}/vuelos`);
}

export async function marcarComoReservado(id: string, viajeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  await supabase
    .from("reservas")
    .update({ estado: "reservado" })
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath(`/viaje/${viajeId}/reservas`);
  revalidatePath(`/viaje/${viajeId}/vuelos`);
}

export async function eliminarReserva(id: string, viajeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  await supabase.from("reservas").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath(`/viaje/${viajeId}/reservas`);
  revalidatePath(`/viaje/${viajeId}/vuelos`);
}
