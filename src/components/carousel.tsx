"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Carril horizontal de tarjetas con flechas.
 *
 * Dos decisiones que vienen de errores anteriores:
 *
 * 1. NO hay degradado en los bordes. Lo hubo, y era justo lo que "cortaba" las
 *    tarjetas: un velo blanco de 64px encima del carril que se comía el borde de la
 *    primera y la última ("onumento" en vez de "Monumento"). Con las tarjetas midiendo
 *    una fracción exacta del carril ya no hay nada que disimular.
 *
 * 2. Las flechas viven FUERA del carril, en un margen propio, para no taparlas.
 */

/** Espacio reservado a cada lado para las flechas, en escritorio. */
const CARRIL_INSET = "sm:mx-11";

const DURACION_MS = 380;

export function Carousel({
  children,
  className,
  sangradoMovil = true,
}: {
  children: ReactNode;
  className?: string;
  /** Deja que las tarjetas lleguen al borde de la pantalla en móvil. */
  sangradoMovil?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const animacion = useRef<number | null>(null);
  const [hayIzquierda, setHayIzquierda] = useState(false);
  const [hayDerecha, setHayDerecha] = useState(false);

  const actualizarBordes = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maximo = el.scrollWidth - el.clientWidth;
    setHayIzquierda(el.scrollLeft > 8);
    setHayDerecha(el.scrollLeft < maximo - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    actualizarBordes();
    // las tarjetas miden una fracción del carril: recalcula al redimensionar
    const observer = new ResizeObserver(actualizarBordes);
    observer.observe(el);
    return () => observer.disconnect();
  }, [actualizarBordes, children]);

  useEffect(() => {
    return () => {
      if (animacion.current) cancelAnimationFrame(animacion.current);
    };
  }, []);

  /**
   * Anima el desplazamiento a mano, cuadro a cuadro.
   *
   * Ni `behavior: "smooth"` ni la clase `scroll-smooth` sirven aquí: combinados con
   * `snap-mandatory`, Chromium cancela el desplazamiento y la flecha no hace NADA.
   * Por eso el snap se desactiva mientras dura la animación y se restaura al final,
   * que es cuando debe encajar la tarjeta.
   */
  function animarHasta(destino: number) {
    const el = scrollRef.current;
    if (!el) return;

    if (animacion.current) cancelAnimationFrame(animacion.current);

    const inicio = el.scrollLeft;
    const distancia = destino - inicio;
    const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (sinMovimiento || Math.abs(distancia) < 2) {
      el.scrollLeft = destino;
      return;
    }

    const snapOriginal = el.style.scrollSnapType;
    el.style.scrollSnapType = "none";
    const t0 = performance.now();

    /**
     * Red de seguridad: si la pestaña pasa a segundo plano, el navegador congela
     * `requestAnimationFrame` y la animación se quedaría a medias, con el snap
     * desactivado para siempre. El temporizador sí sigue corriendo, así que remata.
     */
    const rematar = () => {
      if (animacion.current) cancelAnimationFrame(animacion.current);
      animacion.current = null;
      clearTimeout(guarda);
      el.scrollLeft = destino;
      el.style.scrollSnapType = snapOriginal;
    };
    const guarda = setTimeout(rematar, DURACION_MS + 120);

    const cuadro = (ahora: number) => {
      const avance = Math.min(1, (ahora - t0) / DURACION_MS);
      // ease-out cúbica: arranca rápido y frena al llegar
      const suavizado = 1 - Math.pow(1 - avance, 3);
      el.scrollLeft = inicio + distancia * suavizado;

      if (avance < 1) {
        animacion.current = requestAnimationFrame(cuadro);
        return;
      }
      rematar();
    };

    animacion.current = requestAnimationFrame(cuadro);
  }

  /** Avanza o retrocede UNA tarjeta, para poder verlas todas enteras una a una. */
  function desplazar(direccion: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;

    const primera = el.firstElementChild as HTMLElement | null;
    if (!primera) return;

    const gap = parseFloat(getComputedStyle(el).columnGap || "0") || 0;
    const paso = primera.getBoundingClientRect().width + gap;
    const maximo = el.scrollWidth - el.clientWidth;

    animarHasta(Math.max(0, Math.min(maximo, el.scrollLeft + direccion * paso)));
  }

  return (
    <div className={cn("group relative", sangradoMovil && "-mx-4 sm:mx-0", className)}>
      <div
        ref={scrollRef}
        onScroll={actualizarBordes}
        className={cn(
          // scroll-px acompaña al padding: sin él, snap-start pega la tarjeta al borde
          // y se come el sangrado de móvil
          "no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1",
          CARRIL_INSET,
          sangradoMovil && "px-4 scroll-px-4 sm:px-0 sm:scroll-px-0"
        )}
      >
        {children}
      </div>

      <Flecha lado="left" visible={hayIzquierda} onClick={() => desplazar(-1)} />
      <Flecha lado="right" visible={hayDerecha} onClick={() => desplazar(1)} />
    </div>
  );
}

function Flecha({
  lado,
  visible,
  onClick,
}: {
  lado: "left" | "right";
  visible: boolean;
  onClick: () => void;
}) {
  const Icono = lado === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={visible ? 0 : -1}
      aria-label={lado === "left" ? "Ver anteriores" : "Ver siguientes"}
      className={cn(
        // en el margen propio del carril: no pisa ninguna tarjeta
        "absolute top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm transition-opacity duration-200 hover:border-stone-300 hover:text-stone-900 sm:grid",
        lado === "left" ? "left-0" : "right-0",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <Icono size={16} />
    </button>
  );
}
