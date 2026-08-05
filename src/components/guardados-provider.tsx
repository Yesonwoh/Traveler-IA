"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Qué recomendaciones de este viaje ya están guardadas (en Favoritos o en Reservas).
 *
 * Antes el "ya lo has guardado" vivía solo en el useState de cada botón, así que al
 * recargar la página el botón volvía a ofrecer guardar algo que ya estaba guardado.
 * Ahora el estado inicial viene del servidor y se comparte: la tarjeta del chat y la
 * tarjeta del pin del mapa son el mismo sitio, y deben coincidir.
 */
type Guardados = {
  estaGuardada: (recomendacionId: string) => boolean;
  marcar: (recomendacionId: string) => void;
};

const GuardadosContext = createContext<Guardados | null>(null);

export function GuardadosProvider({
  iniciales,
  children,
}: {
  iniciales: string[];
  children: ReactNode;
}) {
  const [ids, setIds] = useState<Set<string>>(() => new Set(iniciales));

  const marcar = useCallback((recomendacionId: string) => {
    setIds((previo) => {
      if (previo.has(recomendacionId)) return previo;
      const siguiente = new Set(previo);
      siguiente.add(recomendacionId);
      return siguiente;
    });
  }, []);

  const valor = useMemo<Guardados>(
    () => ({ estaGuardada: (id) => ids.has(id), marcar }),
    [ids, marcar]
  );

  return <GuardadosContext.Provider value={valor}>{children}</GuardadosContext.Provider>;
}

/** Devuelve null fuera del provider: los componentes siguen funcionando sin él. */
export function useGuardados(): Guardados | null {
  return useContext(GuardadosContext);
}
