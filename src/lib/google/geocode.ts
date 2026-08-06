import { claveGoogleServidor } from "./claves";

export type Coordenadas = { lat: number; lng: number; countryCode: string | null } | null;

/**
 * Geocodifica una dirección de texto (la que devuelve la IA) a lat/lng + país.
 * El país se usa luego para elegir proveedor de afiliado (Klook en Asia, Tiqets/GetYourGuide fuera).
 *
 * Esto corre en el servidor, así que usa la clave de servidor: una clave restringida por
 * HTTP referrer fallaría aquí y las recomendaciones se quedarían sin pin en el mapa.
 */
export async function geocodeDireccion(direccion: string): Promise<Coordenadas> {
  if (!direccion?.trim()) return null;

  const apiKey = claveGoogleServidor();
  if (!apiKey) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", direccion);
  url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url.toString());
    const data = await res.json();
    const result = data?.results?.[0];
    const location = result?.geometry?.location;
    if (!location) return null;

    const countryComponent = result.address_components?.find((c: { types: string[] }) =>
      c.types.includes("country")
    );

    return {
      lat: location.lat,
      lng: location.lng,
      countryCode: countryComponent?.short_name ?? null,
    };
  } catch {
    return null;
  }
}

export async function geocodeDirecciones(
  direcciones: string[]
): Promise<Coordenadas[]> {
  return Promise.all(direcciones.map(geocodeDireccion));
}
