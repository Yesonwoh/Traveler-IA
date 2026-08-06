import { buscarFotoUnsplash } from "@/lib/unsplash";
import { claveGooglePublica, claveGoogleServidor } from "./claves";

const MAX_FOTOS = 3;

/**
 * Esta URL se guarda en `recomendaciones.fotos_urls` y acaba en un `<img src>` del
 * navegador, que sí manda referrer. Por eso lleva la clave PÚBLICA y no la de servidor:
 * meter aquí la de servidor sería publicarla en cada tarjeta.
 */
function construirUrlFoto(photoReference: string, apiKey: string): string {
  const photoUrl = new URL("https://maps.googleapis.com/maps/api/place/photo");
  photoUrl.searchParams.set("maxwidth", "480");
  photoUrl.searchParams.set("photo_reference", photoReference);
  photoUrl.searchParams.set("key", apiKey);
  return photoUrl.toString();
}

/**
 * Busca hasta 3 fotos reales del lugar en Google Places; si no hay, cae a una foto genérica de Unsplash.
 * Text Search normalmente solo trae 1 foto por resultado, así que si el sitio tiene place_id
 * hacemos una segunda llamada a Place Details (que sí devuelve la galería completa, hasta 10 fotos).
 */
export async function buscarFotosLugar(nombre: string, direccion?: string | null): Promise<string[]> {
  // Las dos búsquedas las hace el servidor (sin referrer); la URL de la foto la pedirá
  // luego el navegador (con referrer). Cada una con la clave que le corresponde.
  const apiKey = claveGoogleServidor();
  const claveFotos = claveGooglePublica();
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

      if (photos && photos.length > 0 && claveFotos) {
        return photos
          .slice(0, MAX_FOTOS)
          .map((photo) => construirUrlFoto(photo.photo_reference, claveFotos));
      }
    } catch {
      // sigue al fallback de Unsplash
    }
  }

  const fallback = await buscarFotoUnsplash(nombre);
  return fallback ? [fallback] : [];
}
