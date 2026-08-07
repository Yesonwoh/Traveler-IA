import {
  Amphora,
  Bath,
  Bed,
  Binoculars,
  Building2,
  Bus,
  Castle,
  Church,
  Coffee,
  Beer,
  Footprints,
  GraduationCap,
  Landmark,
  Library,
  MapPin,
  Mountain,
  Music,
  Palette,
  Plane,
  Ship,
  Star,
  Store,
  Tent,
  Theater,
  TowerControl,
  Train,
  TramFront,
  Trees,
  Ticket,
  Utensils,
  Waves,
  Wine,
  type LucideIcon,
} from "lucide-react";

/**
 * Qué icono lleva cada chincheta del mapa.
 *
 * Tres decisiones que vienen de ver el resultado real:
 *
 * 1. **El `tipo` acota la familia.** Antes las palabras clave se buscaban sin mirar el
 *    tipo, así que un monumento podía acabar con un árbol. Ahora cada tipo tiene su propia
 *    lista de reglas: un `monumento` no puede salir con icono de bosque ni un `restaurante`
 *    con icono de torre, pase lo que pase.
 *
 * 2. **Se busca solo en el NOMBRE, nunca en la opinión.** La opinión es prosa libre de la
 *    IA: una frase como "ideal para pasear entre jardines" convertía el Generalife en un
 *    árbol. El nombre es dato; la opinión es ruido.
 *
 * 3. **Sin acentos y con límites de palabra.** El nombre se normaliza antes de comparar,
 *    así que "Jardín" y "jardin" valen igual; y `\b` evita que "Sacromonte" cuente como
 *    "monte" o que "Plaza" aparezca dentro de otra palabra.
 *
 * Si nada coincide, cada tipo tiene su icono por defecto. Ninguno cae en `Landmark` por
 * descarte: ese es el icono de museo y era el que salía en los miradores.
 */

type Regla = { re: RegExp; icono: LucideIcon };

/**
 * Minúsculas y sin acentos, para poder escribir las reglas en ASCII. `NFD` separa la letra
 * de su tilde y el rango U+0300–U+036F borra las tildes sueltas: "Jardín" queda "jardin" y
 * "Montaña" queda "montana".
 */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const REGLAS: Record<string, Regla[]> = {
  monumento: [
    { re: /\b(catedral|iglesia|basilica|mezquita|monasterio|abadia|ermita|convento|sinagoga|templo)\b/, icono: Church },
    { re: /\b(alhambra|alcazar|alcazaba|castillo|fortaleza|palacio|palau|ciudadela|muralla)\b/, icono: Castle },
    { re: /\b(torre|campanile|faro|giralda|minarete)\b/, icono: TowerControl },
    { re: /\b(museo|pinacoteca|galeria)\b/, icono: Palette },
    { re: /\b(biblioteca)\b/, icono: Library },
    { re: /\b(teatro|anfiteatro|coliseo|arena|plaza de toros)\b/, icono: Theater },
    { re: /\b(ruinas|romano|romanas|arqueologic\w*|acueducto|termas|necropolis|dolmen)\b/, icono: Amphora },
    { re: /\b(universidad|facultad)\b/, icono: GraduationCap },
    { re: /\b(mirador|balcon)\b/, icono: Binoculars },
  ],

  otro: [
    { re: /\b(mirador|miradores|balcon|vistas|viewpoint)\b/, icono: Binoculars },
    { re: /\b(playa|playas|cala|costa|puerto|malecon|lago|rio|embalse|cascada)\b/, icono: Waves },
    { re: /\b(monte|montana|sierra|pico|cerro|colina|volcan|acantilado|desfiladero)\b/, icono: Mountain },
    { re: /\b(parque|jardin|jardines|alameda|bosque|arboreto|huerta)\b/, icono: Trees },
    { re: /\b(mercado|mercadillo|bazar|zoco|rastro|market)\b/, icono: Store },
    { re: /\b(ruta|sendero|camino|paseo|caminata|escalinata)\b/, icono: Footprints },
    { re: /\b(barrio|plaza|plazuela|calle|avenida|casco|juderia|albaicin)\b/, icono: Building2 },
    { re: /\b(cueva|cuevas|gruta)\b/, icono: Mountain },
  ],

  actividad: [
    { re: /\b(free tour|tour|visita guiada|ruta guiada|excursion)\b/, icono: Footprints },
    { re: /\b(flamenco|tablao|concierto|musica|festival)\b/, icono: Music },
    { re: /\b(banos|termas|spa|hammam|balneario)\b/, icono: Bath },
    { re: /\b(kayak|barco|crucero|velero|paddle)\b/, icono: Ship },
    { re: /\b(surf|buceo|snorkel|piscina)\b/, icono: Waves },
    { re: /\b(senderismo|trekking|escalada|via ferrata)\b/, icono: Mountain },
    { re: /\b(cata|degustacion|bodega|vinos)\b/, icono: Wine },
  ],

  restaurante: [
    { re: /\b(cafe|cafeteria|churreria|desayuno|brunch|pasteleria|heladeria)\b/, icono: Coffee },
    { re: /\b(bar|taberna|cerveceria|pub|bodeguita|tapas)\b/, icono: Beer },
    { re: /\b(bodega|vinoteca|vinos|enoteca)\b/, icono: Wine },
    // en inglés también: muchos mercados gastronómicos se llaman "market" (Time Out Market)
    { re: /\b(mercado|mercadillo|gastromercado|market|food hall)\b/, icono: Store },
  ],

  alojamiento: [
    { re: /\b(camping|glamping|bungalow)\b/, icono: Tent },
    { re: /\b(hostel|albergue|hostal|pension|guesthouse|hotel|apartamento|apartamentos)\b/, icono: Bed },
  ],

  transporte: [
    { re: /\b(aeropuerto|airport|terminal)\b/, icono: Plane },
    { re: /\b(tren|renfe|ave|estacion de tren|train)\b/, icono: Train },
    { re: /\b(metro|tranvia|funicular|teleferico)\b/, icono: TramFront },
    { re: /\b(ferry|barco|naviera|puerto)\b/, icono: Ship },
  ],
};

/** Lo que se pinta cuando ninguna regla del tipo coincide. Siempre sensato, nunca museo. */
const POR_DEFECTO: Record<string, LucideIcon> = {
  monumento: Landmark,
  otro: MapPin,
  actividad: Ticket,
  restaurante: Utensils,
  alojamiento: Bed,
  transporte: Bus,
  vuelo: Plane,
};

export function resolveIcono(punto: { tipo?: string; nombre: string }): LucideIcon {
  // "favorito" no viene de la IA: lo pone la pestaña de Favoritos al reutilizar el mapa
  if (punto.tipo === "favorito") return Star;

  // un tipo que la IA se invente cae en "otro", que da MapPin: honesto y nunca engaña
  const tipo = punto.tipo && esTipoValido(punto.tipo) ? punto.tipo : "otro";
  const nombre = normalizar(punto.nombre ?? "");

  for (const { re, icono } of REGLAS[tipo] ?? []) {
    if (re.test(nombre)) return icono;
  }

  return POR_DEFECTO[tipo] ?? MapPin;
}

function esTipoValido(tipo: string): boolean {
  return tipo in POR_DEFECTO;
}
