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
 * Busca hasta 3 fotos reales del lugar en Google Places; si no hay, cae a una foto genérica de Unsplash.
 * Text Search normalmente solo trae 1 foto por resultado, así que si el sitio tiene place_id
 * hacemos una segunda llamada a Place Details (que sí devuelve la galería completa, hasta 10 fotos).
 */
export async function buscarFotosLugar(nombre: string, direccion?: string | null): Promise<string[]> {
  // Todo lo de Places pasa por el servidor: la clave pública no puede tocar esta API.
  const apiKey = claveGoogleServidor();
  const query = [nombre, direccion].filter(Boolean).join(" ");
  if (!query.trim()) return [];

  if (apiKey) {
    try {
      const searchUrl = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
      searchUrl.searchParams.set("query", query);
      searchUrl.searchParams.set("key", apiKey);

      const searchRes = await fetch(searchUrl.toString());
      const searchData = await searchRes.json();
      const primerResultado = searchData?.results?.[0];
      let photos = primerResultado?.photos as { photo_reference: string }[] | undefined;

      const placeId = primerResultado?.place_id as string | undefined;
      if (placeId) {
        const detailsUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
        detailsUrl.searchParams.set("place_id", placeId);
        detailsUrl.searchParams.set("fields", "photos");
        detailsUrl.searchParams.set("key", apiKey);

        const detailsRes = await fetch(detailsUrl.toString());
        const detailsData = await detailsRes.json();
        const photosDetalladas = detailsData?.result?.photos as { photo_reference: string }[] | undefined;
        if (photosDetalladas && photosDetalladas.length > 0) photos = photosDetalladas;
      }

      if (photos && photos.length > 0) {
        return photos.slice(0, MAX_FOTOS).map((photo) => urlFotoProxy(photo.photo_reference));
      }
    } catch {
      // sigue al fallback de Unsplash
    }
  }

  const fallback = await buscarFotoUnsplash(nombre);
  return fallback ? [fallback] : [];
}
