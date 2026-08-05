import type { TIPO_RECOMENDACION } from "@/lib/ai/travelerAI";
import { construirLinkAviasales } from "@/lib/travelpayouts/vuelos";
import { ciudadDesdeDireccion, urlTiqetsPara } from "@/lib/affiliates/tiqets-catalogo";

export type TipoRecomendacion = (typeof TIPO_RECOMENDACION)[number];

/**
 * Proveedores a los que mandamos cada reserva.
 *
 * Aviasales es marca del propio Travelpayouts: basta con el marker. Los demás son
 * programas de terceros que necesitan promo_id/campaign_id de tu panel, configurados
 * por entorno (ver PROGRAMAS); sin esos IDs el enlace sigue funcionando pero va sin
 * comisión, por eso `estaConfigurado()` decide si se ofrece.
 *
 * OJO CON HOTELLOOK: cerró el 20 de octubre de 2025 y su programa de afiliados con él.
 * Sus enlaces antiguos redirigen a la búsqueda genérica de Booking (de ahí el famoso
 * "buscaba Roma y salía Bucarest") y NO generan comisión. Por eso el alojamiento ya no
 * tiene proveedor: hasta que haya uno vivo conectado, esas tarjetas solo se guardan.
 */
export type Proveedor = "aviasales" | "hotellook" | ProgramaTercero | "otro";

// ISO 3166-1 alpha-2 de los países de Asia, donde Klook tiene mucho mejor catálogo.
const PAISES_ASIA = new Set([
  "JP", "TH", "VN", "KR", "CN", "HK", "TW", "SG", "MY", "ID", "PH", "IN",
  "KH", "LA", "MM", "MN", "NP", "LK", "BD", "PK", "AE", "QA", "SA",
]);

type ProgramaTercero =
  | "tiqets"
  | "klook"
  | "kkday"
  | "wegotrip"
  | "gocity"
  | "kiwitaxi"
  | "getyourguide"
  | "radicalstorage";

/** Términos de búsqueda ya codificados: el lugar concreto y la ciudad del viaje. */
type Terminos = { lugar: string; ciudad: string };

type Programa = {
  /** URL de búsqueda del proveedor. */
  busqueda: (t: Terminos) => string;
  /**
   * Cómo se atribuye la comisión, según lo que use cada programa:
   * - `tracking`: parámetros que se pegan a la URL (Tiqets, Klook, WeGoTrip, Kiwitaxi).
   * - `redirect`: plantilla de un redirector que genera su propio id de clic
   *   (KKday vía Involve Asia, Go City vía Partnerize). Usa {url} para el destino
   *   codificado y {url_raw} para el destino tal cual.
   */
  tracking?: string;
  redirect?: string;
  /** Enlace corto del panel: respaldo si no hay nada configurado. */
  enlaceCorto?: string;
};

/**
 * Programas de terceros. Los valores salen de resolver el enlace corto del panel
 * (p. ej. https://tiqets.tpx.gr/xxxx) y quedarse con lo que identifica tu cuenta.
 */
const PROGRAMAS: Record<ProgramaTercero, Programa> = {
  tiqets: {
    // sin barra tras "search": con ella responde 404
    busqueda: ({ lugar }) => `https://www.tiqets.com/es/search?q=${lugar}`,
    tracking: process.env.TP_TIQETS_TRACKING,
    enlaceCorto: process.env.TP_TIQETS_LINK,
  },
  klook: {
    busqueda: ({ lugar }) => `https://www.klook.com/es/search/?query=${lugar}`,
    tracking: process.env.TP_KLOOK_TRACKING,
    enlaceCorto: process.env.TP_KLOOK_LINK,
  },
  kkday: {
    busqueda: ({ lugar }) => `https://www.kkday.com/es/product/productlist?keyword=${lugar}`,
    redirect: process.env.TP_KKDAY_REDIRECT,
    enlaceCorto: process.env.TP_KKDAY_LINK,
  },
  wegotrip: {
    // Su buscador devuelve 404 en cuanto no encuentra nada, y falla en la mayoría de
    // ciudades (Lisboa, Sevilla, Tokio...). Mandar ahí al usuario sería dejarlo en una
    // página de error, así que va a la portada con el tracking puesto.
    busqueda: () => "https://wegotrip.com/",
    tracking: process.env.TP_WEGOTRIP_TRACKING,
    enlaceCorto: process.env.TP_WEGOTRIP_LINK,
  },
  // Go City vende pases de ciudad, no entradas sueltas: no hay búsqueda por lugar
  gocity: {
    busqueda: () => "https://gocity.com/es",
    redirect: process.env.TP_GOCITY_REDIRECT,
    enlaceCorto: process.env.TP_GOCITY_LINK,
  },
  // Kiwitaxi trabaja con un formulario origen/destino, no con búsqueda de texto
  kiwitaxi: {
    busqueda: () => "https://kiwitaxi.com/",
    tracking: process.env.TP_KIWITAXI_TRACKING,
    enlaceCorto: process.env.TP_KIWITAXI_LINK,
  },
  // Consigna de equipaje. La web española usa slugs en español, así que el destino
  // del viaje vale tal cual: /es/consigna-equipaje/roma/
  radicalstorage: {
    busqueda: ({ ciudad }) =>
      ciudad
        ? `https://radicalstorage.com/es/consigna-equipaje/${ciudad}/`
        : "https://radicalstorage.com/es/",
    tracking: process.env.TP_RADICAL_TRACKING,
    enlaceCorto: process.env.TP_RADICAL_LINK,
  },
  // pendiente de aprobación: en cuanto tenga datos entra solo en el reparto
  getyourguide: {
    busqueda: (q) => `https://www.getyourguide.es/s/?q=${q}`,
    tracking: process.env.TP_GETYOURGUIDE_TRACKING,
    enlaceCorto: process.env.TP_GETYOURGUIDE_LINK,
  },
};

function estaConfigurado(programa: ProgramaTercero): boolean {
  const { tracking, redirect, enlaceCorto } = PROGRAMAS[programa];
  return Boolean(tracking || redirect || enlaceCorto);
}

/** Primer programa configurado de la lista; null si ninguno lo está. */
function primerDisponible(...candidatos: ProgramaTercero[]): ProgramaTercero | null {
  return candidatos.find(estaConfigurado) ?? null;
}

/** Contexto del viaje: permite mandar al buscador con la ruta y fechas ya puestas. */
export type ContextoViaje = {
  origenIata?: string | null;
  destinoIata?: string | null;
  ciudadDestino?: string | null;
  fechaIda?: string | null;
  fechaVuelta?: string | null;
  viajeros?: number | null;
};

/**
 * Traslado privado del aeropuerto al centro. Vive aquí y no en las tarjetas del chat:
 * un botón de "Reservar" colgado de un aeropuerto no tenía sentido. Lo usa la pestaña
 * de Vuelos, que es donde el usuario ya está pensando en cómo llegar.
 */
export function linkTrasladoAeropuerto(ciudadDestino?: string | null): string | null {
  const programa = PROGRAMAS.kiwitaxi;
  if (!estaConfigurado("kiwitaxi")) return null;
  return linkPrograma(programa, {
    lugar: encodeURIComponent(ciudadDestino ?? ""),
    ciudad: encodeURIComponent(ciudadDestino ?? ""),
  });
}

/**
 * Consigna de equipaje en la ciudad del viaje.
 *
 * Responde a un problema real del viajero de vuelo barato: el hostal no deja entrar
 * hasta las 14:00 y el vuelo aterriza a las 7. Va en la interfaz y no en boca de la IA
 * para no romper la regla de "no nombres plataformas de reserva" del prompt.
 */
export async function linkConsignaEquipaje(
  ciudadDestino?: string | null
): Promise<string | null> {
  if (!estaConfigurado("radicalstorage")) return null;

  const slug = (ciudadDestino ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  // La mayoría de slugs españoles coinciden (roma, sevilla, lisboa, cracovia), pero
  // no todos: "oporto" da 404 y su página es "porto". En vez de mantener una tabla de
  // excepciones a ciegas, se comprueba la página una vez y se recuerda el resultado.
  const validado = slug ? await ciudadConConsigna(slug) : null;
  const destino = validado ?? "";

  return linkPrograma(PROGRAMAS.radicalstorage, { lugar: destino, ciudad: destino });
}

/** slug -> slug bueno, o null si esa ciudad no tiene página. Se resuelve una vez. */
const consignasComprobadas = new Map<string, Promise<string | null>>();

function ciudadConConsigna(slug: string): Promise<string | null> {
  const cacheado = consignasComprobadas.get(slug);
  if (cacheado) return cacheado;

  const promesa = (async () => {
    // "Oporto" es el caso conocido; el resto se resuelve solo con la comprobación
    const candidatos = slug === "oporto" ? ["porto", slug] : [slug];
    for (const candidato of candidatos) {
      try {
        const res = await fetch(`https://radicalstorage.com/es/consigna-equipaje/${candidato}/`, {
          method: "HEAD",
          redirect: "follow",
          signal: AbortSignal.timeout(2500),
        });
        if (res.ok) return candidato;
      } catch {
        // sin red o demasiado lento: mejor la portada que arriesgar un 404
      }
    }
    return null;
  })();

  consignasComprobadas.set(slug, promesa);
  return promesa;
}

export function proveedorParaRecomendacion(
  tipo: TipoRecomendacion,
  countryCode: string | null
): Proveedor {
  if (tipo === "vuelo") return "aviasales";
  // Hotellook cerró: sin programa de alojamiento conectado no se ofrece reservar, así
  // que la tarjeta se queda solo con "Guardar" en vez de mandar a un enlace muerto.
  if (tipo === "alojamiento") return "otro";

  const enAsia = Boolean(countryCode && PAISES_ASIA.has(countryCode));

  if (tipo === "transporte") {
    // en Asia, Klook y KKday sí venden transporte (trenes, buses, traslados)
    if (enAsia) return primerDisponible("klook", "kkday") ?? "otro";
    // Fuera de Asia no hay nada que vender aquí. Kiwitaxi SÍ vende traslados, pero
    // colgarlo del botón de una tarjeta de aeropuerto quedaba absurdo ("reservar un
    // aeropuerto"), así que ahora vive en la pestaña de Vuelos, que es su sitio.
    return "otro";
  }

  if (tipo === "monumento") {
    // entradas sueltas a monumentos y museos
    if (enAsia) return primerDisponible("klook", "kkday", "tiqets") ?? "otro";
    return primerDisponible("tiqets", "getyourguide", "kkday") ?? "otro";
  }

  if (tipo === "actividad") {
    if (enAsia) return primerDisponible("klook", "kkday") ?? "otro";
    // Tiqets y GetYourGuide van primero porque su buscador sí lleva a la actividad
    // concreta; WeGoTrip queda de última opción porque solo podemos mandar a su portada
    return primerDisponible("getyourguide", "tiqets", "kkday", "wegotrip") ?? "otro";
  }

  return "otro";
}

export function construirLinkAfiliado(params: {
  proveedor: Proveedor;
  nombre: string;
  /** Nombre en inglés: los catálogos de los proveedores están en inglés. */
  nombreEn?: string | null;
  direccion?: string;
  contexto?: ContextoViaje;
}): string | null {
  const { proveedor, nombre, nombreEn, direccion, contexto } = params;
  const marker = process.env.TRAVELPAYOUT_MARKER;

  // Los buscadores de entradas no encuentran nada si les pasas la dirección postal
  // completa ("Rua de São Filipe de Nery, 4050-546 Porto"): buscan por nombre.
  // muchos viajes no tienen destino guardado; la dirección geocodificada sí lo dice
  const ciudad = contexto?.ciudadDestino || ciudadDesdeDireccion(direccion) || "";
  const terminos: Terminos = {
    lugar: encodeURIComponent([nombre, ciudad].filter(Boolean).join(" ")),
    ciudad: encodeURIComponent(ciudad),
  };

  switch (proveedor) {
    case "aviasales": {
      // con ruta conocida mandamos al buscador ya relleno; si no, a la home con marker
      if (contexto?.origenIata && contexto?.destinoIata) {
        return construirLinkAviasales({
          origenIata: contexto.origenIata,
          destinoIata: contexto.destinoIata,
          fechaIda: contexto.fechaIda ?? null,
          fechaVuelta: contexto.fechaVuelta ?? null,
          viajeros: contexto.viajeros ?? 1,
        });
      }
      return marker ? `https://www.aviasales.com/?marker=${marker}` : "https://www.aviasales.com/";
    }

    case "hotellook": {
      /**
       * `search.hotellook.com/?destination=` perdía el destino por el camino: la cadena
       * de redirecciones acababa en `booking.com/searchresults.html` SIN parámetros, y
       * Booking enseñaba su ciudad por defecto (de ahí el "Bucarest" buscando Roma).
       *
       * Se manda el nombre del alojamiento junto a la ciudad para que resuelva el hotel
       * concreto, con fechas y viajeros cuando el viaje los tiene. Sin fechas Hotellook
       * abre su propio selector, que es una página válida.
       */
      const ciudad = contexto?.ciudadDestino || ciudadDesdeDireccion(direccion) || "";
      const consulta = [nombre, ciudad].filter(Boolean).join(" ");

      const params = new URLSearchParams({ destination: consulta });
      if (contexto?.fechaIda) params.set("checkIn", contexto.fechaIda);
      if (contexto?.fechaVuelta) params.set("checkOut", contexto.fechaVuelta);
      params.set("adults", String(Math.min(Math.max(contexto?.viajeros ?? 1, 1), 9)));
      if (marker) params.set("marker", marker);

      return `https://search.hotellook.com/hotels?${params.toString()}`;
    }


    // Tiqets es el único con catálogo descargable: si el sitio está en él, se va
    // directo a su ficha en vez de al buscador (que muchas veces no da resultados).
    case "tiqets": {
      // Del sitio concreto a su página en Tiqets: la atracción si existe, si no un
      // producto de esa ciudad, y como último recurso la ciudad. Ya no hay buscador.
      const destino = urlTiqetsPara({ nombre, nombreEn, ciudad });
      return destino ? conTracking(PROGRAMAS.tiqets, destino, true) : null;
    }

    case "klook":
    case "kkday":
    case "wegotrip":
    case "gocity":
    case "kiwitaxi":
    case "getyourguide":
      return linkPrograma(PROGRAMAS[proveedor], terminos);

    default:
      // Antes esto mandaba a una búsqueda de Google. Un botón que dice "Reservar" y
      // acaba en el buscador de Google es el peor resultado posible: ni reserva, ni
      // comisión, ni sentido. Si no hay proveedor real, no hay enlace, y la interfaz
      // deja de ofrecer el botón (ver `tieneProveedor` en lib/chat/tipos.ts).
      return null;
  }
}

/** ¿Hay algún programa con comisión detrás de este sitio? Decide si se ofrece reservar. */
export function tieneProveedorReal(tipo: TipoRecomendacion, countryCode: string | null): boolean {
  return proveedorParaRecomendacion(tipo, countryCode) !== "otro";
}

/**
 * Deep link con atribución. Según el programa: parámetros pegados a la URL, o el
 * destino envuelto en su redirector (que genera un id de clic nuevo cada vez, por
 * eso no reutilizamos el del enlace corto). Sin nada configurado, cae al enlace
 * corto del panel y, en último caso, a la búsqueda sin comisión.
 */
function linkPrograma(programa: Programa, terminos: Terminos): string {
  return conTracking(programa, programa.busqueda(terminos));
}

/** Pega la atribución del programa a una URL de destino ya resuelta. */
function conTracking(programa: Programa, destino: string, preferirDestino = false): string {
  if (programa.redirect) {
    return programa.redirect
      .replace("{url}", encodeURIComponent(destino))
      .replace("{url_raw}", destino);
  }

  if (programa.tracking) {
    const separador = destino.includes("?") ? "&" : "?";
    return `${destino}${separador}${programa.tracking}`;
  }

  // con un destino concreto (la ficha de un producto) no queremos caer al enlace
  // corto genérico del panel: perderíamos justo el sitio al que íbamos
  if (preferirDestino) return destino;
  return programa.enlaceCorto ?? destino;
}
