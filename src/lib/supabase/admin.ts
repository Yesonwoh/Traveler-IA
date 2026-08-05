import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con service_role: se salta RLS. Solo para código server-to-server
 * sin sesión de usuario (webhooks, jobs), nunca en Server Actions ni Route Handlers
 * que respondan directamente a peticiones de un usuario final.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
