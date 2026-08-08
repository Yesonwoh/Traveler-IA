import type { NextConfig } from "next";

const esDesarrollo = process.env.NODE_ENV === "development";

/**
 * ¿La CSP bloquea de verdad, o solo avisa?
 *
 * En `true` se envía como `Content-Security-Policy-Report-Only`: el navegador NO
 * bloquea nada y escribe cada violación en la consola. Es el modo en el que se estrena,
 * porque una CSP mal calibrada en un sitio con usuarios entrando no da un error
 * pequeño: da una pantalla en blanco.
 *
 * **Activada el 8 de agosto de 2026**, tras dos rondas en modo aviso sobre producción.
 * La primera destapó dos bloqueos que habrían dejado el mapa sin su estilo propio y sin
 * etiquetas (ver el commit que amplió `connect-src`); la segunda salió limpia.
 *
 * Si algún día hay que volver a `true`: eso NO arregla nada por sí solo, solo deja de
 * bloquear. Sirve para diagnosticar, y hay que volver a `false` en cuanto se sepa qué
 * directiva faltaba.
 */
const CSP_SOLO_AVISAR = false;

/**
 * De dónde carga cosas la app, de verdad.
 *
 * - Google Maps sirve su JS desde `maps.googleapis.com` y tira de `maps.gstatic.com`
 *   para el resto. El mapa vectorial usa WebAssembly, de ahí `wasm-unsafe-eval`, y se
 *   pinta con web workers creados desde blobs.
 * - Las tipografías propias las sirve `next/font` desde nuestro dominio; `fonts.g*`
 *   está aquí porque el mapa se trae Roboto por su cuenta.
 * - Vercel Web Analytics se sirve y responde desde nuestro propio dominio (por una ruta
 *   con nombre ofuscado, para que no la tumben los bloqueadores), así que entra en 'self'.
 * - Stripe no carga ningún script: el pago es una redirección a su dominio. Aparece
 *   solo en `form-action` porque el checkout se abre desde el envío de un formulario y
 *   Chrome aplica esa directiva también a la redirección que viene después.
 */
const SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const STRIPE = "https://checkout.stripe.com https://billing.stripe.com";

/**
 * Google Maps no vive en un solo subdominio, y eso se vio en la primera ronda en modo
 * aviso: la política decía `maps.googleapis.com` y el mapa pedía además
 * `mapsresources-pa.googleapis.com` (de ahí saca el estilo propio del Map ID). Con la
 * lista estrecha, el mapa habría salido con el estilo por defecto de Google.
 */
const GOOGLE_SCRIPTS = "https://maps.googleapis.com https://maps.gstatic.com";
const GOOGLE_CONEXIONES =
  "https://*.googleapis.com https://*.gstatic.com https://*.google.com";

const csp = [
  "default-src 'self'",
  // 'unsafe-inline' es inevitable sin nonces, y los nonces obligarían a renderizar
  // TODAS las páginas de forma dinámica (lo dice el doc de Next): adiós al estático y
  // al caché de CDN en una app que es sobre todo móvil. Esta CSP corta los scripts
  // externos no autorizados, no los inline.
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' ${GOOGLE_SCRIPTS}${esDesarrollo ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  // Las fotos vienen de Places, Unsplash, Supabase Storage y los avatares de Google.
  // Se deja https: abierto a propósito: una imagen no ejecuta nada y la lista blanca
  // real serían ocho dominios que cambian solos.
  "img-src 'self' data: blob: https:",
  // `data:` y `blob:` los necesita el propio mapa: su worker de etiquetas hace fetch
  // contra data:image/png para pintar los nombres de calles y sitios. No abre ninguna
  // vía de fuga —a un data: no se le puede mandar nada— pero sin esto no hay etiquetas.
  `connect-src 'self' data: blob: ${SUPABASE} ${GOOGLE_CONEXIONES}`,
  "worker-src 'self' blob:",
  "frame-src 'self'",
  "media-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  `form-action 'self' ${STRIPE}`,
  // Clickjacking: nadie puede meter traveleria.app dentro de un iframe.
  "frame-ancestors 'none'",
  // `upgrade-insecure-requests` NO existe en una política de solo aviso: el navegador
  // la descarta y escribe un error por cada carga de página, que acaba tapando las
  // violaciones de verdad. Entra solo cuando la política bloquea.
  ...(CSP_SOLO_AVISAR ? [] : ["upgrade-insecure-requests"]),
]
  .join("; ")
  .replace(/\s{2,}/g, " ");

const nextConfig: NextConfig = {
  // Quita la cabecera `X-Powered-By: Next.js`, que solo sirve para decirle a quien
  // busca objetivos qué tiene delante.
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: CSP_SOLO_AVISAR
              ? "Content-Security-Policy-Report-Only"
              : "Content-Security-Policy",
            value: csp,
          },
          // Duplica frame-ancestors para navegadores viejos que no leen CSP.
          { key: "X-Frame-Options", value: "DENY" },
          // Impide que el navegador "adivine" que un fichero es de otro tipo del que
          // decimos. Es lo que convierte una imagen subida en un script ejecutable.
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Nada de esto se usa hoy. Se apaga para que un script inyectado tampoco pueda.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)",
          },
          // HTTPS obligatorio durante dos años. Vercel ya lo pone en el dominio propio;
          // dejarlo explícito evita depender de eso. Sin `preload`: eso exige darse de
          // alta en la lista de Chrome y es difícil de revertir.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
