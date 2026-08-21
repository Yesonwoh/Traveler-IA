"use client";

import { useCallback, useSyncExternalStore } from "react";

const CONSULTA = "(pointer: coarse)";

/**
 * Dice si el dispositivo apunta con el dedo en vez de con un ratón.
 *
 * Hace falta porque el mapa es UNA sola instancia compartida por móvil y escritorio (montar
 * dos mapas de Google para lo mismo es caro): no se puede resolver con clases responsive,
 * la decisión la tiene que tomar el JS. En escritorio la tarjeta del punto sale al pasar
 * por encima; con el dedo no existe ese gesto, así que ahí hace falta abrirla al tocar.
 *
 * Va con `useSyncExternalStore` y no con estado + efecto porque eso es exactamente lo que
 * es: una suscripción a algo de fuera de React. De paso resuelve el servidor sin parpadeo,
 * con `false` como valor de render en servidor.
 */
export function usePunteroTactil() {
  const suscribir = useCallback((alCambiar: () => void) => {
    const consulta = window.matchMedia(CONSULTA);
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  return useSyncExternalStore(
    suscribir,
    () => window.matchMedia(CONSULTA).matches,
    () => false
  );
}
