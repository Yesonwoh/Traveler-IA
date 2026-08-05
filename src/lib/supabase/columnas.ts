import type { createClient } from "@/lib/supabase/server";

type Cliente = Awaited<ReturnType<typeof createClient>>;

/**
 * ¿Está aplicada ya la migración que añade `recomendaciones.nombre_en`?
 *
 * Una consulta que pide una columna inexistente no devuelve filas: falla entera. Sin
 * esta comprobación, desplegar el código antes de correr la migración dejaba el chat
 * vacío (la conversación entera desaparecía) y rompía el guardado de mensajes nuevos.
 *
 * Se resuelve una vez por proceso. Cuando apliques la migración, el siguiente arranque
 * del servidor lo detecta solo; no hay nada que tocar en el código.
 */
let cache: boolean | null = null;

export async function hayNombreEn(supabase: Cliente): Promise<boolean> {
  if (cache !== null) return cache;
  const { error } = await supabase.from("recomendaciones").select("nombre_en").limit(1);
  cache = !error;
  return cache;
}
