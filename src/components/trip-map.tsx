"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { Crosshair, MapPinned } from "lucide-react";
import { resolveIcono } from "@/lib/map-icons";

export type PuntoMapa = {
  id: string;
  lat: number;
  lng: number;
  nombre: string;
  tipo?: string;
  direccion?: string | null;
  opinion?: string | null;
};

const NARANJA = "#f97316";
const NARANJA_OSCURO = "#ea580c";

// Sirve para desarrollo/prototipado sin crear un Map ID propio en Google Cloud.
// Se puede sustituir por uno real (Map Management) para estilos avanzados en producción.
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID || "DEMO_MAP_ID";

// pequeño margen antes de cerrar la tarjeta, para poder mover el cursor del pin a la tarjeta sin que se cierre
const CLOSE_DELAY_MS = 150;

/**
 * Hace que nuestros pines tapen las etiquetas e iconos propios de Google que caen debajo.
 * Es lo que quita la duplicación de antes (nuestro pin de la catedral pisando el POI
 * "Catedral de Sevilla" de Google) y baja el ruido del mapa sin tener que crear un estilo
 * en Google Cloud: con `mapId` activo la API ignora la opción `styles`.
 *
 * Va como literal en vez de `google.maps.CollisionBehavior.X` porque el enum solo existe
 * cuando la librería ya está cargada, y estos marcadores se pintan en el primer render.
 */
const OCULTA_POIS_DE_GOOGLE =
  "REQUIRED_AND_HIDES_OPTIONAL" as unknown as google.maps.CollisionBehavior;

/** Encaja la cámara sobre todos los puntos. Lo comparten el ajuste automático y el botón. */
function encajarPuntos(map: google.maps.Map, puntos: PuntoMapa[]) {
  if (puntos.length === 0) return;

  if (puntos.length === 1) {
    map.setCenter({ lat: puntos[0].lat, lng: puntos[0].lng });
    map.setZoom(14);
    return;
  }

  const bounds = new google.maps.LatLngBounds();
  puntos.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
  map.fitBounds(bounds, 64);
}

/** Ajusta la cámara del mapa: centra en un punto concreto (foco elegido en una lista) o encaja todos los puntos. */
function CameraControl({ puntos, focusedId }: { puntos: PuntoMapa[]; focusedId?: string | null }) {
  const map = useMap();
  const key = puntos.map((p) => p.id).join(",");

  useEffect(() => {
    if (!map) return;

    const foco = focusedId ? puntos.find((p) => p.id === focusedId) : null;
    if (foco) {
      map.panTo({ lat: foco.lat, lng: foco.lng });
      if ((map.getZoom() ?? 0) < 15) map.setZoom(15);
      return;
    }

    encajarPuntos(map, puntos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key, focusedId]);

  return null;
}

/**
 * El único control del mapa, y hace dos trabajos con un solo elemento: dice cuántos sitios
 * hay en el viaje y devuelve la vista a todos ellos.
 *
 * El segundo trabajo era un agujero real: con `disableDefaultUI` no hay controles de Google,
 * así que al arrastrar el mapa lejos no había forma de volver salvo recargar la página.
 */
function ContadorYEncuadre({ puntos }: { puntos: PuntoMapa[] }) {
  const map = useMap();
  const total = puntos.length;

  // `puntos` se reconstruye en cada render del padre, así que la identidad del array no
  // sirve como dependencia; lo que importa es qué puntos hay.
  const clave = puntos.map((p) => p.id).join(",");
  const volver = useCallback(() => {
    if (map) encajarPuntos(map, puntos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, clave]);

  const etiqueta = total === 1 ? "1 sitio" : `${total} sitios`;

  return (
    <button
      onClick={volver}
      title="Volver a ver todos los sitios"
      aria-label={`Encuadrar ${etiqueta} en el mapa`}
      className="absolute left-3 top-3 z-10 flex cursor-pointer items-center gap-1.5 rounded-full bg-white/95 py-1.5 pl-2.5 pr-3 text-sm font-semibold text-stone-700 shadow-md shadow-stone-900/15 backdrop-blur-sm transition-colors hover:bg-white hover:text-stone-900"
    >
      <Crosshair size={15} strokeWidth={2.5} aria-hidden className="text-brand" />
      {etiqueta}
    </button>
  );
}

function FadeIn({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={`transition-all duration-200 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

/**
 * La chincheta va como UNA silueta de gota dibujada en SVG, no como un círculo con un
 * rombo suelto debajo: así el anillo blanco recorre el contorno entero sin costuras, que
 * es lo que separa el pin de la teja beige, del verde de parque o del azul de río.
 *
 * Activo = colores invertidos (relleno blanco, naranja oscuro dentro), y el anillo pasa a
 * naranja para que siga recortando sobre el mapa.
 */
function Chincheta({ activo, children }: { activo: boolean; children: ReactNode }) {
  return (
    <div
      className="relative transition-transform duration-150"
      style={{
        transform: activo ? "scale(1.1)" : "scale(1)",
        filter: "drop-shadow(0 2px 3px rgba(28,25,23,0.34))",
      }}
    >
      <svg width="38" height="48" viewBox="0 0 38 48" aria-hidden>
        <path
          d="M19 46.5C19 46.5 33.5 30 33.5 19A14.5 14.5 0 1 0 4.5 19C4.5 30 19 46.5 19 46.5Z"
          fill={activo ? "#ffffff" : NARANJA}
          stroke={activo ? NARANJA_OSCURO : "#ffffff"}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
      {/* el icono se centra en la parte circular (cy=19), no en la caja entera */}
      <div className="absolute left-0 top-0 flex h-[38px] w-[38px] items-center justify-center">
        {children}
      </div>
    </div>
  );
}

/** Lo que ve el usuario mientras el viaje todavía no tiene ni un sitio en el mapa. */
function MapaVacio() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-stone-100 px-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light">
        <MapPinned size={24} strokeWidth={2} className="text-brand-dark" aria-hidden />
      </div>
      <p className="text-base font-bold text-stone-700">Aquí van a caer tus sitios</p>
      {/* stone-600: el fondo de este bloque es stone-100 y stone-500 sobre él se
          queda en 4,43:1, por debajo del mínimo. */}
      <p className="max-w-[15rem] text-pretty text-sm leading-relaxed text-stone-600">
        Cuéntale a la IA a dónde quieres ir y cada sitio que te proponga aparece marcado
        aquí.
      </p>
    </div>
  );
}

export function TripMap({
  puntos,
  renderContent,
  focusedId,
  onPuntoClick,
  showHoverCard = true,
}: {
  puntos: PuntoMapa[];
  renderContent?: (punto: PuntoMapa) => ReactNode;
  focusedId?: string | null;
  /** Se dispara al tocar/clicar un pin. Úsalo para mostrar tu propio panel (p.ej. en móvil) en vez del InfoWindow. */
  onPuntoClick?: (punto: PuntoMapa) => void;
  /** Desactívalo si vas a mostrar el detalle del punto con tu propia UI (onPuntoClick) en vez del InfoWindow nativo. */
  showHoverCard?: boolean;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!apiKey) {
    // Igual que en el buscador de vuelos: al usuario no le sirve de nada el nombre de
    // una variable de entorno, y a nosotros sí. El motivo va a la consola.
    console.error("[mapa] falta NEXT_PUBLIC_GOOGLE_PLACES_API_KEY: el mapa no se monta");
    return (
      /* stone-600 y no stone-500: el fondo aquí es stone-100, y sobre él el gris
         medio se queda en 4,43:1, justo por debajo del mínimo. */
      <div className="flex h-full w-full items-center justify-center bg-stone-100 px-8 text-center text-sm text-stone-600">
        El mapa no está disponible ahora mismo. Tus sitios siguen guardados.
      </div>
    );
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setHoveredId(null), CLOSE_DELAY_MS);
  }

  // Sin puntos, el mapa se quedaba enseñando medio mundo desde Barcelona: un rectángulo
  // que no dice nada y que además hace pensar que algo ha fallado.
  if (puntos.length === 0) return <MapaVacio />;

  const center = { lat: puntos[0].lat, lng: puntos[0].lng };
  const hovered = showHoverCard ? puntos.find((p) => p.id === hoveredId) : undefined;

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        mapId={MAP_ID}
        defaultCenter={center}
        defaultZoom={12}
        gestureHandling="greedy"
        disableDefaultUI
        className="relative h-full w-full"
      >
        <CameraControl puntos={puntos} focusedId={focusedId} />
        <ContadorYEncuadre puntos={puntos} />
        {puntos.map((p) => {
          const Icono = resolveIcono(p);
          const activo = p.id === hoveredId || p.id === focusedId;
          return (
            <AdvancedMarker
              key={p.id}
              position={{ lat: p.lat, lng: p.lng }}
              title={p.nombre}
              zIndex={activo ? 10 : 1}
              collisionBehavior={OCULTA_POIS_DE_GOOGLE}
              onMouseEnter={() => {
                cancelClose();
                setHoveredId(p.id);
              }}
              onMouseLeave={scheduleClose}
              onClick={() => onPuntoClick?.(p)}
            >
              <Chincheta activo={activo}>
                <Icono size={17} color={activo ? NARANJA_OSCURO : "#ffffff"} strokeWidth={2.5} />
              </Chincheta>
            </AdvancedMarker>
          );
        })}

        {hovered && (
          <InfoWindow
            position={{ lat: hovered.lat, lng: hovered.lng }}
            // la chincheta mide 48px y su punta es el ancla: la tarjeta sube por encima
            pixelOffset={[0, -50]}
            headerDisabled
            onCloseClick={() => setHoveredId(null)}
          >
            <div onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
              <FadeIn>
                {renderContent ? (
                  renderContent(hovered)
                ) : (
                  <div className="w-56 p-1">
                    <p className="font-semibold text-stone-900">{hovered.nombre}</p>
                    {hovered.direccion && (
                      <p className="mt-1 text-xs text-stone-500">{hovered.direccion}</p>
                    )}
                  </div>
                )}
              </FadeIn>
            </div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
}
