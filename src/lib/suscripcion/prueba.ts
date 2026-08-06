import type { SupabaseClient } from "@supabase/supabase-js";

/** Días de prueba gratuita al contratar Premium por primera vez. */
export const DIAS_PRUEBA = 3;

/**
 * ¿Está aplicada ya la migración 0011 (`trial_used`, `subscription_trial_end`)?
 *
 * Mismo motivo que `hayNombreEn`: una consulta que pide una columna inexistente no
 * devuelve filas, falla entera. Sin esto, desplegar el código antes de correr la
 * migración dejaría la página de planes y el chat rotos.
 *
 * Se resuelve una vez por proceso. Al aplicar la migración, el siguiente arranque del
 * servidor lo detecta solo.
 */
let cacheColumnas: boolean | null = null;

export async function hayColumnasPrueba(supabase: SupabaseClient): Promise<boolean> {
  if (cacheColumnas !== null) return cacheColumnas;
  const { error } = await supabase.from("profiles").select("trial_used").limit(1);
  cacheColumnas = !error;
  return cacheColumnas;
}

export type EstadoPrueba = {
  /** Ya la gastó: no se le vuelve a ofrecer ni la nombra la IA. */
  usada: boolean;
  /** Fin de la prueba en curso, en ISO. Null si no está en prueba. */
  finaliza: string | null;
};

/**
 * Sin la migración aplicada devuelve `usada: false`: quien decide de verdad si hay
 * prueba es Stripe (ver `crearCheckoutSession`), así que el peor caso es enseñar la
 * oferta a alguien que Stripe acabará cobrando desde el día uno — nunca cobrar de más.
 */
export async function leerEstadoPrueba(
  supabase: SupabaseClient,
  userId: string
): Promise<EstadoPrueba> {
  if (!(await hayColumnasPrueba(supabase))) return { usada: false, finaliza: null };

  const { data } = await supabase
    .from("profiles")
    .select("trial_used, subscription_trial_end")
    .eq("id", userId)
    .single<{ trial_used: boolean | null; subscription_trial_end: string | null }>();

  return {
    usada: data?.trial_used === true,
    finaliza: data?.subscription_trial_end ?? null,
  };
}

/**
 * Días que le quedan de prueba, redondeando hacia arriba: a 4 horas del final se dice
 * "1 día", no "0". Devuelve null si no hay prueba en curso o si ya venció.
 */
export function diasRestantesDePrueba(finaliza: string | null): number | null {
  if (!finaliza) return null;
  const restante = new Date(finaliza).getTime() - Date.now();
  if (!Number.isFinite(restante) || restante <= 0) return null;
  return Math.ceil(restante / 86_400_000);
}

/** "9 de agosto" — la fecha concreta tranquiliza más que "en 3 días". */
export function fechaLarga(iso: string | Date): string {
  const fecha = typeof iso === "string" ? new Date(iso) : iso;
  return fecha.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
}

/** Primer día en que se cobraría si el usuario empezase la prueba ahora mismo. */
export function primerCobroSiEmpiezaHoy(): string {
  return fechaLarga(new Date(Date.now() + DIAS_PRUEBA * 86_400_000));
}
