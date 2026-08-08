"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, Map as MapIcon } from "lucide-react";
import { enviarMensaje, type MensajeDTO } from "@/actions/chat";
import { RecommendationCarousel } from "@/components/recommendation-carousel";
import { FlightTeaser } from "@/components/flight-teaser";
import { PinDetailCard } from "@/components/pin-detail-card";
import { TripMap, type PuntoMapa } from "@/components/trip-map";
import { MapSheet } from "@/components/map-sheet";
import { MapPinPanel } from "@/components/map-pin-panel";
import { FormattedText } from "@/components/formatted-text";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type RutaViaje = {
  origen: string;
  destino: string;
  fechaIda: string;
  fechaVuelta: string;
  viajeros: number;
};

export function ChatView({
  viajeId,
  mensajesIniciales,
  isPremium,
  ruta,
}: {
  viajeId: string;
  mensajesIniciales: MensajeDTO[];
  isPremium: boolean;
  ruta: RutaViaje | null;
}) {
  const [mensajes, setMensajes] = useState<MensajeDTO[]>(mensajesIniciales);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapAbierto, setMapAbierto] = useState(false);
  const [mostrarBotonMapa, setMostrarBotonMapa] = useState(false);
  const [puntoSeleccionadoId, setPuntoSeleccionadoId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const yaColocado = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Al abrir el viaje hay que aterrizar abajo sin animación y sin depender de que las
    // fotos de las tarjetas hayan medido: con scroll suave la conversación se quedaba
    // arriba del todo y parecía que faltaba la respuesta.
    if (!yaColocado.current) {
      yaColocado.current = true;
      el.scrollTop = el.scrollHeight;
      const frame = requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
      return () => cancelAnimationFrame(frame);
    }

    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [mensajes]);

  function onScrollMensajes() {
    const el = scrollRef.current;
    if (!el) return;
    const actual = el.scrollTop;
    const delta = actual - lastScrollTop.current;
    if (delta > 4) setMostrarBotonMapa(true);
    else if (delta < -4) setMostrarBotonMapa(false);
    lastScrollTop.current = actual;
  }

  /**
   * Antes esto buscaba el último mensaje que mencionara la palabra "vuelo", así que en
   * viajes donde la IA no la usaba (o dejaba de usarla) el buscador de vuelos
   * desaparecía del chat sin motivo. Si el viaje tiene ruta, la tarjeta va siempre en
   * el último mensaje de la IA: es una ayuda de navegación, no una respuesta al texto.
   */
  const idUltimoConVuelos = mensajes.filter((m) => m.esIA).at(-1)?.id ?? null;

  const puntos: PuntoMapa[] = mensajes
    .flatMap((m) => m.recomendaciones)
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => ({
      id: r.id,
      lat: r.lat!,
      lng: r.lng!,
      nombre: r.nombre,
      tipo: r.tipo,
      direccion: r.direccion,
      opinion: r.opinion,
    }));

  const recomendacionesPorId = new Map(
    mensajes.flatMap((m) => m.recomendaciones).map((r) => [r.id, r])
  );

  function renderPuntoMapaEscritorio(p: PuntoMapa) {
    const recomendacion = recomendacionesPorId.get(p.id);
    return recomendacion ? (
      <PinDetailCard
        recomendacion={recomendacion}
        viajeId={viajeId}
        className="w-72"
        photoClassName="h-40"
      />
    ) : (
      <p className="w-56 p-1 font-semibold text-stone-900">{p.nombre}</p>
    );
  }

  const puntoSeleccionado = puntoSeleccionadoId ? recomendacionesPorId.get(puntoSeleccionadoId) : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const texto = input.trim();
    if (!texto || isPending) return;

    const optimistic: MensajeDTO = {
      id: `local-${Date.now()}`,
      texto,
      esIA: false,
      createdAt: new Date().toISOString(),
      recomendaciones: [],
    };
    setMensajes((prev) => [...prev, optimistic]);
    setInput("");
    setIsPending(true);
    setError(null);

    try {
      const res = await enviarMensaje(viajeId, texto);
      if (res.ok) {
        setMensajes((prev) => [...prev, res.mensaje]);
      } else {
        // Se retira el mensaje optimista y se le devuelve el texto al campo: si se
        // queda colgado en la conversación parece enviado, y encima pierde lo escrito.
        setMensajes((prev) => prev.filter((m) => m.id !== optimistic.id));
        setInput(texto);
        setError(res.error);
      }
    } catch {
      setMensajes((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(texto);
      setError("No se pudo enviar. Comprueba tu conexión e inténtalo de nuevo.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    /* El alto lo fija el layout del viaje (app shell). Aquí solo se reparte: el chat
       ocupa lo que sobra y el mapa es una columna fija, ambos a sangre en escritorio.

       El `bg-white` es lo que se ve por el hueco que dejan las esquinas redondeadas del
       mapa: sin él asomaba el stone-50 del armazón de la app y esas esquinas salían más
       oscuras que el chat, que es justo lo que delata el recorte. */
    <div className="flex h-full min-h-0 flex-col bg-white lg:flex-row">
      {/* Sin borde derecho en escritorio: la costura con el mapa ya la hace su esquina
          redondeada, y dos separadores seguidos ensucian.

          El tope de ancho a partir de 2xl es lo que cierra el hueco de en medio: la
          conversación nunca pasa de max-w-3xl, así que en un monitor ancho la columna
          seguía creciendo y dejaba cientos de píxeles en blanco entre el texto y el mapa.
          Con el tope, ese espacio se lo queda el mapa. */}
      <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col bg-white 2xl:max-w-[860px]">
        <div
          ref={scrollRef}
          onScroll={onScrollMensajes}
          className={cn(
            // En escritorio la conversación se pega a la izquierda en vez de ir centrada:
            // centrada dejaba hueco muerto a los dos lados de la columna, y ese hueco es
            // precisamente lo que ahora se lleva el mapa. La medida de lectura no cambia,
            // la sigue fijando max-w-3xl.
            "no-scrollbar mx-auto w-full min-w-0 max-w-3xl flex-1 space-y-5 overflow-y-auto p-4 sm:px-6 lg:mx-0 lg:pl-8 xl:pl-12",
            puntos.length > 0 && "pb-12 lg:pb-4"
          )}
        >
          {mensajes.length === 0 && (
            <div className="flex h-full items-center justify-center px-8 text-center text-sm text-stone-500">
              Cuéntame a dónde quieres ir, desde dónde sales y tu presupuesto. Yo me encargo del
              resto. 🎒
            </div>
          )}

          {mensajes.map((m) => (
            <div key={m.id} className="min-w-0">
              {/* La IA no va en burbuja: un itinerario largo dentro de un bloque gris se
                  convierte en un muro donde nada destaca. Se pinta como contenido de la
                  página y la burbuja se reserva para lo que dice el usuario. */}
              {m.esIA ? (
                <div className="min-w-0">
                  {isPremium && (
                    <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                      <Sparkles size={11} /> Traveler IA Pro
                    </p>
                  )}
                  <FormattedText texto={m.texto} />
                </div>
              ) : (
                <div className="flex min-w-0 justify-end">
                  <p className="min-w-0 max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-sm leading-relaxed text-white">
                    {m.texto}
                  </p>
                </div>
              )}

              {m.recomendaciones.length > 0 && (
                <RecommendationCarousel recomendaciones={m.recomendaciones} viajeId={viajeId} />
              )}

              {/* solo en el último mensaje que habla de volar: si no, repetiríamos la
                  misma tarjeta por toda la conversación y una consulta por cada una */}
              {ruta && m.id === idUltimoConVuelos && <FlightTeaser viajeId={viajeId} {...ruta} />}
            </div>
          ))}

          {isPending && (
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <Loader2 size={14} className="animate-spin" /> Traveler IA está pensando...
            </div>
          )}
        </div>

        {error && <p className="px-4 text-sm text-red-600">{error}</p>}

        {puntos.length > 0 && (
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 flex justify-center transition-all duration-200 lg:hidden",
              mostrarBotonMapa
                ? "bottom-[4.5rem] translate-y-0 opacity-100"
                : "bottom-[4.5rem] translate-y-2 opacity-0"
            )}
          >
            <button
              onClick={() => setMapAbierto(true)}
              className="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand/30"
            >
              <MapIcon size={15} /> Ver mapa
            </button>
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="shrink-0 border-t border-stone-200 bg-white px-4 py-3 sm:px-6 lg:pl-8 xl:pl-12"
        >
          {/* mismo tratamiento que los mensajes, o el campo de escribir se desalinearía
              con la conversación que tiene encima */}
          <div className="mx-auto flex w-full max-w-3xl items-center gap-2 lg:mx-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ej: Quiero ir a Portugal con 200€ desde Madrid"
              className="h-11 min-w-0 flex-1 rounded-xl border border-stone-300 px-4 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-500 focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <Button
              type="submit"
              aria-label="Enviar mensaje"
              disabled={isPending || !input.trim()}
              className="shrink-0 px-3.5"
            >
              <Send size={16} />
            </Button>
          </div>
        </form>
      </div>

      {/* El mapa se redondea solo por la izquierda, que es el lado que da al chat: por
          la derecha toca el borde de la ventana, y ahí una esquina redonda solo enseñaría
          fondo. La sombra hacia la izquierda lo separa del chat sin necesidad de un borde,
          y de paso no se pierde ni un píxel de mapa. */}
      {/* `lg:shrink-0` mantiene los anchos fijos hasta xl; a partir de 2xl el mapa pasa a
          `flex-1` y se queda todo lo que le sobra al chat. Las dos reglas no chocan porque
          la de 2xl va después en la hoja de estilos.

          Sin sombra a propósito: una sombra hacia fuera cae precisamente sobre el hueco de
          las esquinas y lo ensucia de gris. El recorte ya se lee solo, porque el mapa va
          lleno de color y el fondo es blanco. */}
      <div className="hidden overflow-hidden rounded-l-[2rem] lg:block lg:h-full lg:w-[460px] lg:shrink-0 xl:w-[640px] 2xl:w-auto 2xl:flex-1">
        <TripMap puntos={puntos} renderContent={renderPuntoMapaEscritorio} />
      </div>

      <div className="lg:hidden">
        <MapSheet
          open={mapAbierto}
          onClose={() => {
            setMapAbierto(false);
            setPuntoSeleccionadoId(null);
          }}
        >
          <div className="relative h-full w-full">
            <TripMap
              puntos={puntos}
              showHoverCard={false}
              onPuntoClick={(p) => setPuntoSeleccionadoId(p.id)}
            />
            {puntoSeleccionado && (
              <MapPinPanel
                recomendacion={puntoSeleccionado}
                viajeId={viajeId}
                onClose={() => setPuntoSeleccionadoId(null)}
              />
            )}
          </div>
        </MapSheet>
      </div>
    </div>
  );
}
