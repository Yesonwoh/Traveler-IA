import type { createClient } from "@/lib/supabase/server";

type Cliente = Awaited<ReturnType<typeof createClient>>;

/**
 * Topes de uso por usuario, en un solo sitio.
 *
 * Cada uno de estos gestos cuesta dinero de verdad: una llamada a OpenAI, una
 * geocodificación por sitio y una foto por sitio. Sin tope, a una persona con un bucle
 * en la consola le sale gratis vaciarnos la cuenta, y a un bot registrado también.
 *
 * Están holgados a propósito. Una conversación real de planificar un viaje son diez o
 * quince mensajes y uno o dos viajes: un usuario normal no los ve nunca.
 *
 * Crear un viaje es MÁS caro que un mensaje —lleva propuesta, título y foto de
 * portada— y hasta ahora era lo único que no tenía freno.
 */
export const TOPES = {
  mensajes: { hora: 30, dia: 100 },
  viajes: { hora: 10, dia: 30 },
} as const;

export type ResultadoTope = { ok: true } | { ok: false; error: string };

/**
 * Cuenta lo que el usuario ha hecho en las últimas 24 h y decide si puede seguir.
 *
 * Una sola consulta para las dos ventanas: se traen las marcas de tiempo del día y la
 * de la hora se filtra en memoria. Un contador en la tabla sería más barato, pero se
 * puede inflar desde el cliente y hay que mantenerlo; esto se apoya en las filas reales.
 *
 * Los dos usos tienen índice por (user_id, created_at): `mensajes_user_created_idx` en
 * la migración 0012 y `viajes_user_created_idx` en la 0013.
 */
async function comprobar(
  supabase: Cliente,
  tabla: "mensajes" | "viajes",
  userId: string,
  topes: { hora: number; dia: number },
  textos: { dia: string; hora: string }
): Promise<ResultadoTope> {
  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const consulta = supabase
    .from(tabla)
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", hace24h)
    .limit(topes.dia + 1);

  // Los mensajes de la IA no cuentan contra el usuario: solo lo que él envía.
  const { data, error } = await (tabla === "mensajes"
    ? consulta.eq("es_ia", false)
    : consulta);

  // Si la comprobación falla, se deja pasar. Es deliberado: un fallo transitorio de la
  // base de datos no debe convertirse en "no puedes usar la app". Lo que cubre este
  // tope es gasto, no acceso, y detrás sigue estando el límite de la cuenta de OpenAI.
  if (error) {
    console.error(`[limites] no se pudo comprobar el tope de ${tabla}:`, error.message);
    return { ok: true };
  }

  const marcas = (data ?? []).map((f) => new Date(f.created_at).getTime());
  if (marcas.length >= topes.dia) return { ok: false, error: textos.dia };

  const haceUnaHora = Date.now() - 60 * 60 * 1000;
  if (marcas.filter((t) => t >= haceUnaHora).length >= topes.hora) {
    return { ok: false, error: textos.hora };
  }

  return { ok: true };
}

export function topeDeMensajes(supabase: Cliente, userId: string) {
  return comprobar(supabase, "mensajes", userId, TOPES.mensajes, {
    dia: "Has llegado al máximo de mensajes por hoy. Vuelve mañana y seguimos.",
    hora: "Vas muy rápido: espera un rato y sigue con el plan.",
  });
}

export function topeDeViajes(supabase: Cliente, userId: string) {
  return comprobar(supabase, "viajes", userId, TOPES.viajes, {
    dia: "Has creado muchos viajes hoy. Vuelve mañana y seguimos.",
    hora: "Vas muy rápido creando viajes: espera un rato y sigue con los que ya tienes.",
  });
}
