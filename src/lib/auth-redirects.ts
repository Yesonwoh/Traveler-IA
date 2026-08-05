import { headers } from "next/headers";

const RUTA_POR_DEFECTO = "/mis-viajes";

// El `next` de los formularios y del callback llega desde el cliente, así que no
// se puede pasar tal cual a redirect(): acepta URLs absolutas, y "//evil.com" o
// "/\evil.com" los resuelve el navegador como dominio externo. Un atacante que
// mande a la víctima a /login?next=<su sitio> la acaba soltando en una copia
// falsa de la app justo después de que ella haya escrito su contraseña de verdad.
export function rutaSegura(next: string | null | undefined): string {
  if (!next || !next.startsWith("/")) return RUTA_POR_DEFECTO;
  if (next.startsWith("//") || next.startsWith("/\\")) return RUTA_POR_DEFECTO;
  return next;
}

// Supabase necesita una URL absoluta para el redirectTo de OAuth y de los emails
// de recuperación. La cabecera `origin` solo viaja en peticiones cross-origin, así
// que en producción detrás de un proxy suele llegar vacía y el enlace acaba siendo
// "null/auth/callback". Preferimos NEXT_PUBLIC_SITE_URL cuando está configurada.
export async function urlDelSitio(): Promise<string> {
  const configurada = process.env.NEXT_PUBLIC_SITE_URL;
  if (configurada) return configurada.replace(/\/+$/, "");

  const cabeceras = await headers();
  const origin = cabeceras.get("origin");
  if (origin) return origin;

  const host = cabeceras.get("host");
  if (host) {
    const protocolo = cabeceras.get("x-forwarded-proto") ?? "https";
    return `${protocolo}://${host}`;
  }

  return "http://localhost:3000";
}
