import type { SupabaseClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe/client";
import { leerEstadoPrueba } from "./prueba";

/**
 * ¿Le corresponde a este usuario la prueba gratuita?
 *
 * Es una por persona, y de esto depende que se cobre o no, así que se comprueba dos
 * veces a propósito:
 *
 * 1. La marca del perfil, que es gratis y es la que ve el resto de la app.
 * 2. Stripe, que es la fuente real: si el cliente ya tuvo cualquier suscripción
 *    (aunque la cancelara, aunque la base de datos se haya quedado atrás), no hay
 *    segunda prueba.
 *
 * Ante la duda devuelve `false`. Vive aparte de `prueba.ts` para que el SDK de Stripe
 * no acabe arrastrado a un bundle de cliente por los ayudantes de fechas.
 */
export async function tienePruebaDisponible(
  supabase: SupabaseClient,
  userId: string,
  customerId: string | null
): Promise<boolean> {
  const { usada } = await leerEstadoPrueba(supabase, userId);
  if (usada) return false;

  // sin cliente de Stripe todavía no ha pagado nunca: la prueba es suya
  if (!customerId) return true;

  try {
    const previas = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });
    return previas.data.length === 0;
  } catch {
    return false;
  }
}
