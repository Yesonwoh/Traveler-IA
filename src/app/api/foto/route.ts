import { NextResponse } from "next/server";
import { claveGoogleServidor } from "@/lib/google/claves";

/**
 * Sirve las fotos de Google Places haciendo de intermediario.
 *
 * Antes la URL de la foto se construía con la clave pública y se metía tal cual en un
 * `<img src>`. Eso dejó de funcionar al restringir esa clave por dominio, y no por un
 * despiste de configuración: Google lo prohíbe de plano. Su respuesta literal es
 *
 *   REQUEST_DENIED — API keys with referer restrictions cannot be used with this API.
 *
 * O sea que una clave utilizable desde el navegador **nunca** puede pedir fotos de Places,
 * y una clave que sí puede pedirlas no se puede proteger por dominio. Poner esa segunda
 * clave en el `src` de cada tarjeta sería publicarla en el HTML.
 *
 * Con este proxy la clave no sale del servidor: el navegador pide `/api/foto?ref=…`, y
 * nosotros vamos a Google. De paso resuelve una deuda que ya arrastrábamos — las URLs
 * guardadas en `recomendaciones.fotos_urls` llevaban la clave incrustada, así que rotarla
 * habría roto todas las fotos ya guardadas.
 *
 * `/api` está fuera del matcher del proxy de sesión (ver `src/proxy.ts`), así que esto no
 * paga un `getUser()` por imagen.
 */

/** Tope de ancho servido, para que nadie use esto como redimensionador gratis. */
const ANCHO_MAXIMO = 1200;
const ANCHO_POR_DEFECTO = 480;

/** Las referencias de Places son cadenas largas seguras para URL. Nada más pasa. */
const REFERENCIA_VALIDA = /^[A-Za-z0-9_\-=.]{20,2000}$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const referencia = searchParams.get("ref");

  if (!referencia || !REFERENCIA_VALIDA.test(referencia)) {
    return new NextResponse("Referencia de foto no válida", { status: 400 });
  }

  const pedido = Number(searchParams.get("w"));
  const ancho = Number.isFinite(pedido) && pedido > 0 ? Math.min(pedido, ANCHO_MAXIMO) : ANCHO_POR_DEFECTO;

  const apiKey = claveGoogleServidor();
  if (!apiKey) return new NextResponse("Falta la clave de Google", { status: 500 });

  const url = new URL("https://maps.googleapis.com/maps/api/place/photo");
  url.searchParams.set("maxwidth", String(ancho));
  url.searchParams.set("photo_reference", referencia);
  url.searchParams.set("key", apiKey);

  let respuesta: Response;
  try {
    respuesta = await fetch(url, { redirect: "follow" });
  } catch {
    return new NextResponse("No se pudo pedir la foto", { status: 502 });
  }

  const tipo = respuesta.headers.get("content-type") ?? "";
  // Google contesta 200 con una imagen de "mapa tachado" cuando deniega: si no es una
  // imagen de verdad, mejor un 502 y que la tarjeta caiga a su hueco que un cartel de error
  // de Google metido en el carrusel.
  if (!respuesta.ok || !tipo.startsWith("image/")) {
    return new NextResponse("Foto no disponible", { status: 502 });
  }

  return new NextResponse(respuesta.body, {
    headers: {
      "content-type": tipo,
      // una foto de Places no cambia nunca: se cachea fuerte en el navegador y en el CDN
      "cache-control": "public, max-age=86400, s-maxage=2592000, immutable",
    },
  });
}
