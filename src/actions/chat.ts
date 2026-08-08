"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { topeDeMensajes } from "@/lib/limites";
import { procesarMensajeIA } from "@/lib/chat/responder";
import type { MensajeDTO } from "@/lib/chat/tipos";

export type { MensajeDTO, RecomendacionDTO } from "@/lib/chat/tipos";

/**
 * Los errores esperados se DEVUELVEN, no se lanzan: Next.js censura el mensaje de
 * cualquier excepción que salga de una Server Action en producción, así que un
 * `throw new Error("has llegado al límite")` le llegaría al usuario como un error
 * genérico y pensaría que la app está rota.
 */
export type EnvioResultado =
  | { ok: true; mensaje: MensajeDTO }
  | { ok: false; error: string };

/** Un mensaje de chat largo de verdad no llega a esto; lo que sí llega es un pegado masivo. */
const MAX_CARACTERES = 2000;

export async function enviarMensaje(
  viajeId: string,
  texto: string
): Promise<EnvioResultado> {
  const textoLimpio = texto.trim();
  if (!textoLimpio) return { ok: false, error: "Escribe algo primero." };

  if (textoLimpio.length > MAX_CARACTERES) {
    return {
      ok: false,
      error: `Ese mensaje es demasiado largo (${textoLimpio.length} caracteres). Córtalo a ${MAX_CARACTERES} o menos.`,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Tu sesión ha caducado. Vuelve a entrar." };

  // Que el viaje sea suyo. RLS ya impide LEER los mensajes de otro, pero no impedía
  // ESCRIBIR en el viaje de otra persona: la política de 'mensajes' solo comprueba
  // user_id, y un viaje_id ajeno pasaba el filtro sin más.
  const { data: viaje } = await supabase
    .from("viajes")
    .select("id")
    .eq("id", viajeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!viaje) return { ok: false, error: "Ese viaje no existe o no es tuyo." };

  const tope = await topeDeMensajes(supabase, user.id);
  if (!tope.ok) return { ok: false, error: tope.error };

  const { count } = await supabase
    .from("mensajes")
    .select("id", { count: "exact", head: true })
    .eq("viaje_id", viajeId);
  const esPrimerMensaje = (count ?? 0) === 0;

  let respuesta: MensajeDTO;
  try {
    respuesta = await procesarMensajeIA({
      viajeId,
      userId: user.id,
      texto: textoLimpio,
    });
  } catch {
    return { ok: false, error: "La IA no pudo responder. Inténtalo de nuevo." };
  }

  revalidatePath(`/viaje/${viajeId}/chat`);
  if (esPrimerMensaje) revalidatePath("/mis-viajes");

  return { ok: true, mensaje: respuesta };
}
