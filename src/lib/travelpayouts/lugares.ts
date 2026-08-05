/**
 * Resuelve el nombre de una ciudad ("Málaga", "Oporto") a su código IATA ("AGP", "OPO"),
 * que es lo que exige la API de precios de Travelpayouts.
 * El autocompletado de Travelpayouts es público: no necesita token.
 */

export type LugarIata = {
  iata: string;
  nombre: string;
  pais: string | null;
};

const AUTOCOMPLETE_URL = "https://autocomplete.travelpayouts.com/places2";

type CandidatoApi = { code?: string; name?: string; country_name?: string };

function normalizar(texto: string): string {
  // NFD + quitar marcas diacríticas: "Málaga" → "malaga"
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

/**
 * El autocompletado hace coincidencia difusa y su primer resultado puede no tener
 * nada que ver: "Oporto" devuelve Chişinău (RMO) antes que Porto (OPO). Preferimos
 * el que de verdad coincide por nombre.
 */
function elegirMejor(candidatos: CandidatoApi[], termino: string): CandidatoApi | null {
  if (candidatos.length === 0) return null;

  const buscado = normalizar(termino);

  const exacto = candidatos.find((c) => normalizar(c.name!) === buscado);
  if (exacto) return exacto;

  // "Oporto" ↔ "Porto": uno contiene al otro
  const contenido = candidatos.find((c) => {
    const nombre = normalizar(c.name!);
    return nombre.includes(buscado) || buscado.includes(nombre);
  });
  if (contenido) return contenido;

  return candidatos[0];
}

export async function buscarIata(ciudad: string): Promise<LugarIata | null> {
  // admite "Málaga, España": nos quedamos con la ciudad
  const termino = ciudad.split(",")[0]!.trim();
  if (!termino) return null;

  const url = new URL(AUTOCOMPLETE_URL);
  url.searchParams.set("term", termino);
  url.searchParams.set("locale", "es");
  url.searchParams.set("types[]", "city");

  try {
    const res = await fetch(url.toString(), {
      // el catálogo de ciudades no cambia: cachea un día para no llamar en cada búsqueda
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const candidatos = (data as CandidatoApi[]).filter((c) => c.code && c.name);
    const elegido = elegirMejor(candidatos, termino);
    if (!elegido) return null;

    return {
      iata: elegido.code!.toUpperCase(),
      nombre: elegido.name ?? termino,
      pais: elegido.country_name ?? null,
    };
  } catch {
    return null;
  }
}

/** Resuelve origen y destino a la vez; cualquiera de los dos puede quedar en null. */
export async function resolverRuta(origen: string, destino: string) {
  const [desde, hasta] = await Promise.all([
    origen ? buscarIata(origen) : Promise.resolve(null),
    destino ? buscarIata(destino) : Promise.resolve(null),
  ]);
  return { desde, hasta };
}
