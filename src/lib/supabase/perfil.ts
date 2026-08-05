import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Lee el perfil pidiendo las columnas de preferencias y, si esa base de datos
 * todavía no tiene aplicada la migración 0005, reintenta con las columnas base.
 * Evita que la app se quede sin datos de perfil en ese estado intermedio.
 */
export async function leerPerfil<T>(
  supabase: SupabaseClient,
  userId: string,
  columnas: string,
  columnasFallback: string
): Promise<T | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(columnas)
    .eq("id", userId)
    .single<T>();

  if (!error && data) return data;

  const { data: basico } = await supabase
    .from("profiles")
    .select(columnasFallback)
    .eq("id", userId)
    .single<T>();

  return basico ?? null;
}
