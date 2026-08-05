/**
 * Cliente de la Data API de Travelpayouts (precios de vuelos).
 *
 * OJO: esta API sirve precios *cacheados* — son tarifas encontradas recientemente por
 * otros usuarios, no una cotización en vivo. Por eso la UI habla de "desde X €" y el
 * precio definitivo lo fija el buscador al que enviamos con el enlace de afiliado.
 *
 * Usamos /v1/prices/calendar porque devuelve una tarifa por cada día del mes (con
 * aerolínea, número de vuelo y escalas). /v1/prices/cheap solo devuelve UNA por ruta,
 * así que queda como respaldo cuando el calendario viene vacío.
 *
 * Docs: https://travelpayouts-data-api.readthedocs.io/en/latest/
 */

const API_BASE = "https://api.travelpayouts.com";
const LOGO_BASE = "https://pics.avs.io/200/50";
const MAX_RESULTADOS = 12;

export type VueloDTO = {
  id: string;
  origenIata: string;
  destinoIata: string;
  aerolinea: string;
  aerolineaNombre: string;
  esLowcost: boolean;
  logoUrl: string;
  numeroVuelo: string | null;
  salida: string;
  vuelta: string | null;
  escalas: number;
  duracionIdaMin: number | null;
  precio: number;
  moneda: string;
  urlReserva: string;
};

export type ResultadoVuelos =
  | { estado: "ok"; vuelos: VueloDTO[] }
  | { estado: "sin-credenciales"; vuelos: [] }
  | { estado: "error"; vuelos: []; mensaje: string };

type TicketApi = {
  price?: number;
  airline?: string;
  flight_number?: number | string;
  departure_at?: string;
  return_at?: string;
  transfers?: number;
  duration_to?: number;
  duration?: number;
};

export async function buscarVuelos(params: {
  origenIata: string;
  destinoIata: string;
  fechaIda?: string | null;
  fechaVuelta?: string | null;
  soloDirectos?: boolean;
  moneda?: string;
  viajeros?: number;
}): Promise<ResultadoVuelos> {
  const token = process.env.TRAVELPAYOUT_API_KEY;
  if (!token) return { estado: "sin-credenciales", vuelos: [] };

  const moneda = params.moneda ?? "eur";

  try {
    let tickets = await pedirCalendario({ ...params, moneda, token });
    if (tickets.length === 0) {
      tickets = await pedirMasBarato({ ...params, moneda, token });
    }

    const nombres = await cargarAerolineas();

    let vuelos = tickets
      .filter((t) => t.price && t.departure_at)
      .map((ticket) => construirVuelo(ticket, params, moneda, nombres));

    if (params.soloDirectos) vuelos = vuelos.filter((v) => v.escalas === 0);

    // la caché devuelve tarifas de cualquier mes: si el usuario pidió fechas,
    // nos quedamos con las de ese mes (salvo que no quede ninguna)
    if (params.fechaIda) {
      const mesPedido = mesDe(params.fechaIda);
      const delMes = vuelos.filter((v) => mesDe(v.salida) === mesPedido);
      if (delMes.length > 0) vuelos = delMes;
    }

    vuelos.sort((a, b) => a.precio - b.precio);

    return { estado: "ok", vuelos: vuelos.slice(0, MAX_RESULTADOS) };
  } catch {
    return { estado: "error", vuelos: [], mensaje: "No se pudo contactar con el buscador." };
  }
}

/** Una tarifa por día del mes de salida. La clave de cada entrada es la fecha. */
async function pedirCalendario(p: {
  origenIata: string;
  destinoIata: string;
  fechaIda?: string | null;
  moneda: string;
  token: string;
}): Promise<TicketApi[]> {
  const url = new URL(`${API_BASE}/v1/prices/calendar`);
  url.searchParams.set("origin", p.origenIata);
  url.searchParams.set("destination", p.destinoIata);
  url.searchParams.set("calendar_type", "departure_date");
  url.searchParams.set("currency", p.moneda);
  url.searchParams.set("depart_date", mesDe(p.fechaIda));

  const json = await pedir<Record<string, TicketApi>>(url, p.token);
  return Object.values(json ?? {});
}

/** Respaldo: la tarifa más barata de la ruta, sin desglose por fechas. */
async function pedirMasBarato(p: {
  origenIata: string;
  destinoIata: string;
  fechaIda?: string | null;
  fechaVuelta?: string | null;
  moneda: string;
  token: string;
}): Promise<TicketApi[]> {
  const url = new URL(`${API_BASE}/v1/prices/cheap`);
  url.searchParams.set("origin", p.origenIata);
  url.searchParams.set("destination", p.destinoIata);
  url.searchParams.set("currency", p.moneda);

  const json = await pedir<Record<string, Record<string, TicketApi>>>(url, p.token);

  // data → { DESTINO: { "0": ticket } }, donde la clave es el nº de escalas
  return Object.values(json ?? {}).flatMap((porEscalas) =>
    Object.entries(porEscalas ?? {}).map(([clave, ticket]) => ({
      ...ticket,
      transfers: ticket.transfers ?? Number(clave) ?? 0,
    }))
  );
}

async function pedir<T>(url: URL, token: string): Promise<T | null> {
  const res = await fetch(url.toString(), {
    headers: { "X-Access-Token": token },
    // los datos ya vienen de caché en su lado: 30 min es de sobra y ahorra cuota
    next: { revalidate: 1800 },
  });
  if (!res.ok) return null;

  const json = (await res.json()) as { success?: boolean; data?: T };
  return json.success ? (json.data ?? null) : null;
}

function construirVuelo(
  ticket: TicketApi,
  params: { origenIata: string; destinoIata: string; viajeros?: number },
  moneda: string,
  aerolineas: Map<string, { nombre: string; lowcost: boolean }>
): VueloDTO {
  const aerolinea = (ticket.airline ?? "").toUpperCase();
  const info = aerolineas.get(aerolinea);

  return {
    id: `${ticket.departure_at}-${aerolinea}-${ticket.flight_number ?? "s/n"}`,
    origenIata: params.origenIata,
    destinoIata: params.destinoIata,
    aerolinea,
    aerolineaNombre: info?.nombre ?? aerolinea,
    esLowcost: info?.lowcost ?? false,
    logoUrl: `${LOGO_BASE}/${aerolinea}.png`,
    numeroVuelo: ticket.flight_number ? `${aerolinea}${ticket.flight_number}` : null,
    salida: ticket.departure_at!,
    vuelta: ticket.return_at ?? null,
    escalas: ticket.transfers ?? 0,
    duracionIdaMin: ticket.duration_to ?? ticket.duration ?? null,
    precio: ticket.price!,
    moneda,
    urlReserva: construirLinkAviasales({
      origenIata: params.origenIata,
      destinoIata: params.destinoIata,
      fechaIda: ticket.departure_at ?? null,
      fechaVuelta: ticket.return_at ?? null,
      viajeros: params.viajeros ?? 1,
    }),
  };
}

/** Deep link de Aviasales: /search/AGP2408MAD29081 (origen+DDMM+destino+DDMM+pasajeros). */
export function construirLinkAviasales(params: {
  origenIata: string;
  destinoIata: string;
  fechaIda: string | null;
  fechaVuelta: string | null;
  viajeros?: number;
}): string {
  const { origenIata, destinoIata, fechaIda, fechaVuelta } = params;
  const marker = process.env.TRAVELPAYOUT_MARKER;

  const ida = formatearDDMM(fechaIda);
  const vuelta = formatearDDMM(fechaVuelta);
  const viajeros = Math.min(Math.max(params.viajeros ?? 1, 1), 9);

  // Sin fecha NO hay deep link válido. Antes se mandaba a `/search/GRXROM`, que no es
  // una ruta que Aviasales entienda: el usuario aterrizaba en una página de error.
  // Ahora, sin fecha, se va a la portada con el marcador puesto (página válida y con
  // comisión) y es la pestaña de Vuelos de la app la que resuelve la búsqueda real.
  if (!ida) {
    return marker ? `https://www.aviasales.com/?marker=${marker}` : "https://www.aviasales.com/";
  }

  const ruta = `${origenIata}${ida}${destinoIata}${vuelta ?? ""}${viajeros}`;
  const base = `https://www.aviasales.com/search/${ruta}`;
  return marker ? `${base}?marker=${marker}` : base;
}

/** La API espera el mes de salida como YYYY-MM. */
function mesDe(fechaIso: string | null | undefined): string {
  const fecha = fechaIso ? new Date(fechaIso) : new Date();
  const valida = Number.isNaN(fecha.getTime()) ? new Date() : fecha;
  return `${valida.getFullYear()}-${String(valida.getMonth() + 1).padStart(2, "0")}`;
}

function formatearDDMM(iso: string | null): string | null {
  if (!iso) return null;
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return null;
  const dia = String(fecha.getUTCDate()).padStart(2, "0");
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  return `${dia}${mes}`;
}

let cacheAerolineas: Map<string, { nombre: string; lowcost: boolean }> | null = null;

/** Catálogo público de aerolíneas (código IATA → nombre y si es low-cost). */
async function cargarAerolineas() {
  if (cacheAerolineas) return cacheAerolineas;

  try {
    const res = await fetch(`${API_BASE}/data/airlines.json`, { next: { revalidate: 86400 } });
    if (!res.ok) return new Map<string, { nombre: string; lowcost: boolean }>();

    const data = (await res.json()) as { code?: string; name?: string; is_lowcost?: boolean }[];
    cacheAerolineas = new Map(
      data
        .filter((a) => a.code && a.name)
        .map((a) => [a.code!.toUpperCase(), { nombre: a.name!, lowcost: !!a.is_lowcost }])
    );
    return cacheAerolineas;
  } catch {
    return new Map<string, { nombre: string; lowcost: boolean }>();
  }
}
