"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Reproduce una vez la secuencia de su contenido cuando entra en pantalla.
 *
 * El estado inicial (todo escondido) lo pone ESTE guion, no el HTML: así, si el
 * JavaScript no llega a ejecutarse o la hidratación falla, lo que sirvió el servidor
 * se queda visible tal cual en vez de dejar un hueco en blanco. Quien pide menos
 * movimiento no entra aquí siquiera: se queda con ese mismo HTML final.
 *
 * No usa estado de React a propósito. La escena se dispara una sola vez y no cambia
 * nada del árbol, así que tocar el atributo del nodo evita un render entero.
 */
export function EscenaAnimada({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    el.dataset.escena = "espera";

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        el.dataset.escena = "anima";
        // se reproduce una sola vez: ni se repite al volver a subir ni sigue observando
        observador.disconnect();
      },
      { threshold: 0.2 }
    );

    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <div ref={raiz} data-escena="listo" className={className}>
      {children}
    </div>
  );
}
