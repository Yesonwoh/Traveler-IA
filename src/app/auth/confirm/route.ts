import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { rutaSegura } from "@/lib/auth-redirects";

/**
 * Entrada de los enlaces que llegan por EMAIL (reset de contraseña y confirmación
 * de registro). Existe aparte de /auth/callback por un motivo concreto.
 *
 * /auth/callback usa `exchangeCodeForSession`, que es el flujo PKCE: para canjear el
 * código hace falta una cookie "code verifier" que solo existe en **el mismo
 * navegador** que pidió el enlace. Eso vale para el login con Google, donde ida y
 * vuelta ocurren en la misma pestaña, pero se rompe con los correos: la gente pide el
 * reset desde el móvil y abre el correo en la app de Gmail, que es otro contexto. Sin
 * la cookie, el canje falla y el usuario acaba en /login sin entender nada.
 *
 * `verifyOtp` con `token_hash` no necesita esa cookie, así que el enlace funciona
 * aunque se abra en otro navegador o en otro dispositivo. Es lo que documenta Supabase
 * para apps que renderizan en servidor.
 *
 * Efecto secundario que también arregla: los escáneres de enlaces de algunos correos
 * corporativos (Safe Links de Microsoft, por ejemplo) visitan las URLs antes que el
 * usuario. Con el enlace de Supabase eso gastaba el token y la persona se encontraba
 * "Token has expired or is invalid"; aquí el token se gasta contra nuestro dominio.
 */

/** Solo los tipos que la app usa de verdad; cualquier otro no se procesa. */
const TIPOS_VALIDOS = new Set<EmailOtpType>(["recovery", "email", "signup"]);

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;
  const next = rutaSegura(searchParams.get("next"));

  if (tokenHash && tipo && TIPOS_VALIDOS.has(tipo)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=El enlace no es válido o ha caducado", origin)
  );
}
