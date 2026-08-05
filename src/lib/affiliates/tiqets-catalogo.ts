/**
 * Catálogo de Tiqets: ciudades, lugares y productos.
 *
 * De dónde sale: de los sitemaps públicos en español que Tiqets publica en su
 * robots.txt (`site-map-city-es`, `site-map-location-es`, `site-map-product-es`).
 * Son ficheros pensados para ser leídos, y traen el catálogo entero con los nombres
 * YA en español, que es lo que resuelve el problema de fondo: los ficheros del panel
 * de Travelpayouts venían en inglés y con 50-164 productos, así que "Catedral de
 * Sevilla" no casaba con nada.
 *
 * Para qué sirve: para que el botón de reservar lleve al SITIO concreto y no al
 * buscador ni a la ciudad en general. Se busca en tres niveles:
 *   1. el lugar (la página de la atracción, con todas sus entradas),
 *   2. un producto concreto dentro de la ciudad del viaje,
 *   3. la ciudad, como red de seguridad.
 *
 * Cómo actualizarlo: volver a descargar esos tres sitemaps y regenerar el JSON. No
 * corre prisa; el catálogo se mueve despacio.
 */

export type CiudadTiqets = { id: number; nombre: string };
export type LugarTiqets = { id: number; nombre: string };
/** `c` es el id de la ciudad a la que pertenece el producto. */
export type ProductoTiqets = { id: number; nombre: string; c: number };

type Catalogo = { ciudades: CiudadTiqets[]; lugares: LugarTiqets[]; productos: ProductoTiqets[] };

const VACIO: Catalogo = { ciudades: [], lugares: [], productos: [] };

let cache: Catalogo | null = null;

/** Se lee del disco una sola vez por proceso; el fichero es opcional. */
function cargar(): Catalogo {
  if (cache) return cache;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("node:fs") as typeof import("node:fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("node:path") as typeof import("node:path");
    const ruta = path.join(process.cwd(), "src/lib/affiliates/tiqets-catalogo.json");
    cache = JSON.parse(fs.readFileSync(ruta, "utf8")) as Catalogo;
  } catch {
    cache = VACIO;
  }
  return cache ?? VACIO;
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** El slug de Tiqets es el nombre normalizado con guiones. */
function aSlug(nombre: string): string {
  return normalizar(nombre).replace(/ /g, "-");
}

/** Ciudades escritas en español en el catálogo, pero el usuario puede usar el exónimo. */
const ALIAS_CIUDAD: Record<string, string> = {
  oporto: "oporto", porto: "oporto", lisbon: "lisboa", seville: "sevilla",
  london: "londres", rome: "roma", florence: "florencia", venice: "venecia",
  naples: "napoles", munich: "munich", prague: "praga", vienna: "viena",
  warsaw: "varsovia", krakow: "cracovia", athens: "atenas", copenhagen: "copenhague",
  stockholm: "estocolmo", istanbul: "estambul", geneva: "ginebra", bruges: "brujas",
  antwerp: "amberes", "new york": "nueva york", tokyo: "tokio", milan: "milan",
};

function ciudadCanonica(ciudad: string): string {
  const n = normalizar(ciudad);
  return ALIAS_CIUDAD[n] ?? n;
}

/** Palabras que no distinguen un sitio de otro y ensucian la comparación. */
const VACIAS = new Set([
  "de", "del", "la", "el", "los", "las", "y", "con", "the", "of", "para",
  "entradas", "entrada", "ticket", "tickets", "tour", "tours", "visita",
  "guiada", "guiado", "sin", "colas", "acceso",
]);

function tokens(texto: string): Set<string> {
  return new Set(normalizar(texto).split(" ").filter((t) => t.length > 2 && !VACIAS.has(t)));
}

/**
 * Parecido entre dos nombres como media armónica de cobertura y precisión.
 *
 * La precisión importa tanto como la cobertura: sin ella, "Catedral de Sevilla" casaba
 * al 100% con "Real Maestranza tour guiado con visita opcional a la catedral de
 * Sevilla", porque contenía todas las palabras buscadas. Penalizar el ruido del
 * candidato es lo que hace que gane la ficha de la catedral y no la de la plaza de toros.
 */
function similitud(buscado: string, candidato: string): number {
  const a = tokens(buscado);
  const b = tokens(candidato);
  if (a.size === 0 || b.size === 0) return 0;

  let comunes = 0;
  for (const t of a) if (b.has(t)) comunes++;
  if (comunes === 0) return 0;

  const cobertura = comunes / a.size;
  const precision = comunes / b.size;
  return (2 * cobertura * precision) / (cobertura + precision);
}

const UMBRAL_LUGAR = 0.75;
const UMBRAL_PRODUCTO = 0.55;

function mejor<T extends { nombre: string }>(
  lista: T[],
  consultas: string[],
  filtro?: (item: T) => boolean
): { item: T | null; puntuacion: number } {
  let elegido: T | null = null;
  let puntuacion = 0;
  for (const item of lista) {
    if (filtro && !filtro(item)) continue;
    for (const consulta of consultas) {
      const s = similitud(consulta, item.nombre);
      if (s > puntuacion) {
        puntuacion = s;
        elegido = item;
      }
    }
  }
  return { item: elegido, puntuacion };
}

/**
 * Saca la ciudad de una dirección geocodificada por Google.
 *
 * Hace falta porque muchos viajes tienen `destino` vacío (los creados conversando, sin
 * pasar por el formulario). La dirección sí la tenemos siempre y viene con formato
 * fijo: "Av. Cristo de la Expiración, s/n, 41001 Sevilla, España".
 */
export function ciudadDesdeDireccion(direccion: string | null | undefined): string | null {
  if (!direccion) return null;
  const partes = direccion.split(",").map((p) => p.trim()).filter(Boolean);
  if (partes.length < 2) return null;

  // el último trozo es el país; el anterior lleva la ciudad, a veces con código postal
  const candidata = partes[partes.length - 2].replace(/\b\d[\d\s-]*\b/g, "").trim();
  return candidata.length > 1 ? candidata : null;
}

export function buscarCiudadTiqets(ciudad: string | null | undefined): CiudadTiqets | null {
  if (!ciudad) return null;
  const objetivo = ciudadCanonica(ciudad);
  return cargar().ciudades.find((c) => normalizar(c.nombre) === objetivo) ?? null;
}

/**
 * URL de Tiqets para un sitio recomendado, lo más concreta posible.
 * Devuelve null cuando no hay ni ciudad reconocida: preferimos no ofrecer reserva
 * antes que mandar al usuario a un buscador vacío.
 */
export function urlTiqetsPara(params: {
  nombre: string;
  nombreEn?: string | null;
  ciudad?: string | null;
}): string | null {
  const { ciudades, lugares, productos } = cargar();
  if (ciudades.length === 0) return null;

  const ciudad = buscarCiudadTiqets(params.ciudad);
  // añadir la ciudad a la consulta rescata nombres cortos: "Coliseo" no llega a
  // "coliseo de roma", pero "Coliseo Roma" sí
  const consultas = [params.nombre, params.nombreEn, ciudad && `${params.nombre} ${ciudad.nombre}`]
    .filter((c): c is string => Boolean(c));

  // 1. la atracción en sí: su página lista todas sus entradas
  const lugar = mejor(lugares, consultas);
  if (lugar.item && lugar.puntuacion >= UMBRAL_LUGAR) {
    return `https://www.tiqets.com/es/entradas-${aSlug(lugar.item.nombre)}-l${lugar.item.id}/`;
  }

  // 2. un producto concreto, siempre dentro de la ciudad del viaje
  if (ciudad) {
    const producto = mejor(productos, consultas, (p) => p.c === ciudad.id);
    if (producto.item && producto.puntuacion >= UMBRAL_PRODUCTO) {
      return `https://www.tiqets.com/es/atracciones-${aSlug(ciudad.nombre)}-c${ciudad.id}/entradas-para-${aSlug(producto.item.nombre)}-p${producto.item.id}/`;
    }
  }

  // 3. red de seguridad: lo que se vende en esa ciudad, con precios
  if (ciudad) {
    return `https://www.tiqets.com/es/atracciones-${aSlug(ciudad.nombre)}-c${ciudad.id}/`;
  }

  return null;
}
