"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps";
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

const BARCELONA = { lat: 41.3874, lng: 2.1686 };

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

    if (puntos.length === 0) return;

    if (puntos.length === 1) {
      map.setCenter({ lat: puntos[0].lat, lng: puntos[0].lng });
      map.setZoom(14);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    puntos.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
    map.fitBounds(bounds, 64);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key, focusedId]);

  return null;
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

function PinMarker({ activo }: { activo: boolean }) {
  return (
    <div
      className="-mt-[7px] h-3 w-3 rotate-45 rounded-[2px] border transition-colors duration-150"
      style={{
        background: activo ? "#ffffff" : NARANJA,
        borderColor: activo ? NARANJA_OSCURO : "transparent",
        boxShadow: "0 1px 2px rgba(28,25,23,0.28)",
      }}
    />
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
    return (
      <div className="flex h-full w-full items-center justify-center bg-stone-100 text-sm text-stone-400">
        Falta la API key de Google Maps.
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

  const center = puntos[0] ? { lat: puntos[0].lat, lng: puntos[0].lng } : BARCELONA;
  const hovered = showHoverCard ? puntos.find((p) => p.id === hoveredId) : undefined;

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        mapId={MAP_ID}
        defaultCenter={center}
        defaultZoom={puntos.length ? 12 : 4}
        gestureHandling="greedy"
        disableDefaultUI
        className="h-full w-full"
      >
        <CameraControl puntos={puntos} focusedId={focusedId} />
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
              <div className="flex flex-col items-center">
                {/* El anillo blanco es lo que separa el pin del mapa: sobre teja beige,
                    verde de parque o azul de río, el naranja solo no recorta. */}
                {/* Activo = colores invertidos (fondo blanco, icono naranja). El anillo
                    pasa a naranja para que el pin siga recortando sobre el mapa. */}
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full border-[2.5px] transition-transform duration-150"
                  style={{
                    background: activo ? "#ffffff" : NARANJA,
                    borderColor: activo ? NARANJA_OSCURO : "#ffffff",
                    boxShadow: "0 2px 6px rgba(28,25,23,0.35)",
                    transform: activo ? "scale(1.12)" : "scale(1)",
                  }}
                >
                  <Icono
                    size={18}
                    color={activo ? NARANJA_OSCURO : "#ffffff"}
                    strokeWidth={2.5}
                  />
                </div>
                <PinMarker activo={activo} />
              </div>
            </AdvancedMarker>
          );
        })}

        {hovered && (
          <InfoWindow
            position={{ lat: hovered.lat, lng: hovered.lng }}
            pixelOffset={[0, -44]}
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
                      <p className="mt-1 text-xs text-stone-400">{hovered.direccion}</p>
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
