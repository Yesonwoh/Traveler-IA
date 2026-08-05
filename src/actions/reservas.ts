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

export async function marcarComoReservado(id: string, viajeId: string) {
  const supabase = await createClient();
  await supabase.from("reservas").update({ estado: "reservado" }).eq("id", id);
  revalidatePath(`/viaje/${viajeId}/reservas`);
  revalidatePath(`/viaje/${viajeId}/vuelos`);
}

export async function eliminarReserva(id: string, viajeId: string) {
  const supabase = await createClient();
  await supabase.from("reservas").delete().eq("id", id);
  revalidatePath(`/viaje/${viajeId}/reservas`);
  revalidatePath(`/viaje/${viajeId}/vuelos`);
}
