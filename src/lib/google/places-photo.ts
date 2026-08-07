import { buscarFotoUnsplash } from "@/lib/unsplash";
import { claveGoogleServidor } from "./claves";

const MAX_FOTOS = 3;
const ANCHO_FOTO = 480;

/**
 * La foto NO apunta a Google, apunta a nuestro `/api/foto`.
 *
 * Google rechaza las claves restringidas por dominio en la API de Places ("API keys with
 * referer restrictions cannot be used with this API"), así que una clave que valga desde el
 * navegador no puede pedir fotos, y la que sí puede no se puede proteger por dominio. Con
 * el proxy la clave se queda en el servidor.
 *
 * Ventaja añadida: en la base de datos ya no se guarda ninguna clave, así que rotarla no
 * rompe las fotos que haya guardadas.
 */
export function urlFotoProxy(photoReference: string, ancho = ANCHO_FOTO): string {
  const params = new URLSearchParams({ ref: photoReference, w: String(ancho) });
  return `/api/foto?${params}`;
}

/**
 * Las recomendaciones guardadas antes del proxy llevan la URL de Google con la clave
 * dentro, y esa clave ya no sirve. Se reescriben al vuelo al leerlas, así no hace falta
 * migrar la tabla ni se pierden las fotos de los viajes que ya existen.
 */
export function normalizarFotos(urls: (string | null)[] | null | undefined): string[] {
  const limpias: string[] = [];

  for (const url of urls ?? []) {
    if (!url) continue;
    if (!url.includes("/maps/api/place/photo")) {
      limpias.push(url);
      continue;
    }
    try {
      const params = new URL(url).searchParams;
      const referencia = params.get("photo_reference");
      const ancho = Number(params.get("maxwidth")) || ANCHO_FOTO;
      limpias.push(referencia ? urlFotoProxy(referencia, ancho) : url);
    } catch {
      limpias.push(url);
    }
  }

  return limpias;
}

/**
 * Saca la ciudad de una dirección de Google ("Paseo del Padre Manjón, 18010 Granada,
 * España" -> "Granada"). El penúltimo trozo es la localidad, con el código postal
 * delante cuando lo hay.
 */
function ciudadDeDireccion(direccion?: string | null): string | null {
  const partes = (direccion ?? "").split(",").map((p) => p.trim()).filter(Boolean);
  if (partes.length < 2) return null;
  const localidad = partes[partes.length - 2].replace(/^\d[\d\s-]*/, "").trim();
  return localidad || null;
}

/** Una consulta a Places Text Search + su Place Details. Devuelve las referencias de foto. */
async function fotosDePlaces(query: string, apiKey: string): Promise<string[]> {
  const searchUrl = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  searchUrl.searchParams.set("query", query);
  searchUrl.searchParams.set("key", apiKey);

  const searchData = await (await fetch(searchUrl.toString())).json();
  const primerResultado = searchData?.results?.[0];
  let photos = primerResultado?.photos as { photo_reference: string }[] | undefined;

  // Text Search normalmente trae 1 foto por resultado; Place Details devuelve la
  // galería completa (hasta 10), así que merece la pena la segunda llamada.
  const placeId = primerResultado?.place_id as string | undefined;
  if (placeId) {
    const detailsUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    detailsUrl.searchParams.set("place_id", placeId);
    detailsUrl.searchParams.set("fields", "photos");
    detailsUrl.searchParams.set("key", apiKey);

    const detailsData = await (await fetch(detailsUrl.toString())).json();
    const photosDetalladas = detailsData?.result?.photos as { photo_reference: string }[] | undefined;
    if (photosDetalladas && photosDetalladas.length > 0) photos = photosDetalladas;
  }

  return (photos ?? []).slice(0, MAX_FOTOS).map((photo) => urlFotoProxy(photo.photo_reference));
}

/**
 * Busca hasta 3 fotos reales del lugar, con varios intentos de menos a más genérico.
 *
 * El primer intento pega el nombre y la dirección tal cual, y eso falla cuando los dos
 * no coinciden: "Paseo de los Tristes Paseo del Padre Manjón, 18010 Granada, España"
 * son dos nombres distintos del mismo sitio en la misma consulta, y Places no lo
 * resuelve. Por eso hay un segundo intento con el nombre y la ciudad a secas, que es
 * como lo buscaría una persona.
 *
 * El respaldo de Unsplash también lleva la ciudad: buscar "Paseo de los Tristes" a
 * secas devuelve cero resultados (comprobado contra su API), porque Unsplash está
 * etiquetado sobre todo en inglés y por topónimos conocidos.
 */
export async function buscarFotosLugar(nombre: string, direccion?: string | null): Promise<string[]> {
  // Todo lo de Places pasa por el servidor: la clave pública no puede tocar esta API.
  const apiKey = claveGoogleServidor();
  const ciudad = ciudadDeDireccion(direccion);

  const intentos = [
    [nombre, direccion].filter(Boolean).join(" "),
    ciudad ? `${nombre} ${ciudad}` : null,
  ].filter((q): q is string => Boolean(q?.trim()));

  if (apiKey) {
    for (const query of intentos) {
      try {
        const fotos = await fotosDePlaces(query, apiKey);
        if (fotos.length > 0) return fotos;
      } catch {
        // el siguiente intento, y si no el respaldo de Unsplash
      }
    }
  }

  for (const query of [ciudad ? `${nombre} ${ciudad}` : null, nombre]) {
    if (!query) continue;
    const fallback = await buscarFotoUnsplash(query);
    if (fallback) return [fallback];
  }

  return [];
}
