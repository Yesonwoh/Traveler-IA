/**
 * Google Maps se consume desde DOS contextos que necesitan restricciones opuestas, y
 * por eso hacen falta dos claves distintas:
 *
 * - **Desde el navegador** (el mapa de `trip-map.tsx`, y las `<img>` de fotos de Places):
 *   la petición lleva cabecera `Referer`, así que la clave se puede —y se debe— restringir
 *   por *HTTP referrer* a nuestros dominios. Como viaja al navegador, es pública por
 *   definición: el referrer es lo único que impide que otro la use.
 *
 * - **Desde el servidor** (geocodificar direcciones y buscar sitios en Places, dentro de
 *   `lib/chat/responder.ts`): `fetch` desde una función de Vercel **no manda referrer**.
 *   Una clave restringida por referrer devolvería `REQUEST_DENIED` aquí, y las
 *   recomendaciones se quedarían sin coordenadas y sin foto **en silencio**. Esta clave se
 *   restringe por API (Geocoding + Places), no por referrer, y nunca sale del servidor:
 *   sin prefijo `NEXT_PUBLIC_`, Next no la incrusta en el bundle del cliente.
 *
 * Mientras `GOOGLE_SERVER_API_KEY` no exista, se cae a la pública y todo funciona igual que
 * antes. Eso permite desplegar este cambio sin coordinarlo con la consola de Google: primero
 * el código, luego la clave nueva, y solo entonces restringir la pública.
 */

/**
 * Toda llamada a Google que no sea el SDK del mapa pasa por aquí.
 *
 * **La clave pública no sirve para la API de Places, ni siquiera desde el navegador.**
 * Comprobado contra Google: una clave con restricción por dominio responde
 * `REQUEST_DENIED — API keys with referer restrictions cannot be used with this API`.
 * Por eso las fotos van por `/api/foto` en vez de apuntar a Google directamente: la clave
 * de servidor no puede protegerse por dominio, así que no puede salir al navegador.
 *
 * La pública (`NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`) se usa en un único sitio,
 * `trip-map.tsx`, y solo para cargar el SDK del mapa. Ese sí acepta restricción por
 * dominio, que es lo que la protege.
 */
export function claveGoogleServidor(): string | undefined {
  return process.env.GOOGLE_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
}
