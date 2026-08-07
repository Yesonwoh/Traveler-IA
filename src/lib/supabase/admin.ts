import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con service_role: se salta RLS.
 *
 * Su sitio natural es el código server-to-server sin sesión (webhooks, jobs). En una
 * Server Action solo se usa cuando se cumplen las DOS condiciones a la vez:
 *   1. la identidad del usuario ya está verificada con `auth.getUser()`, y
 *   2. lo que se escribe lo genera el servidor, no llega del cliente.
 *
 * Hoy el único caso así es guardar el `stripe_customer_id` recién creado (ver
 * src/actions/stripe.ts): esa columna está fuera del grant de `authenticated` desde
 * la migración 0012, así que la sesión del usuario ya no puede escribirla.
 *
 * Nunca lo uses para escribir datos que vengan del formulario o de la URL.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
