"use client";

import { useState, useTransition } from "react";
import { agregarFavorito } from "@/actions/favoritos";
import { guardarReserva } from "@/actions/reservas";
import { useGuardados } from "@/components/guardados-provider";
import type { RecomendacionDTO } from "@/actions/chat";

const RESERVABLES = new Set(["vuelo", "alojamiento", "actividad", "transporte"]);
// los monumentos se guardan en Favoritos, pero además se les puede comprar la entrada
const CON_ENTRADAS = new Set(["monumento"]);

export function useGuardarRecomendacion(recomendacion: RecomendacionDTO, viajeId: string) {
  const guardados = useGuardados();
  const [guardadoLocal, setGuardadoLocal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // sin programa con comisión detrás no se ofrece reservar: antes ese caso acababa
  // en una búsqueda de Google con el botón puesto igualmente
  const hayProveedor = recomendacion.tieneProveedor !== false;
  const esReservable = RESERVABLES.has(recomendacion.tipo) && hayProveedor;
  const tieneEntradas = CON_ENTRADAS.has(recomendacion.tipo) && hayProveedor;

  // el estado inicial lo pone el servidor, así que recargar ya no "olvida" lo guardado
  const done = guardadoLocal || (guardados?.estaGuardada(recomendacion.id) ?? false);

  function recordar() {
    setGuardadoLocal(true);
    guardados?.marcar(recomendacion.id);
  }

  async function abrirAfiliado() {
    const { urlAfiliado } = await guardarReserva({
      viajeId,
      recomendacionId: recomendacion.id,
      tipo: recomendacion.tipo as never,
      nombre: recomendacion.nombre,
      direccion: recomendacion.direccion,
      countryCode: recomendacion.countryCode,
    });
    if (urlAfiliado) window.open(urlAfiliado, "_blank", "noopener,noreferrer");
  }

  function guardar() {
    startTransition(async () => {
      if (esReservable) {
        await abrirAfiliado();
      } else {
        await agregarFavorito({
          viajeId,
          recomendacionId: recomendacion.id,
          nombre: recomendacion.nombre,
          direccion: recomendacion.direccion,
          lat: recomendacion.lat,
          lng: recomendacion.lng,
        });
      }
      recordar();
    });
  }

  /** Compra de entrada para monumentos: no sustituye a guardarlo en Favoritos. */
  function verEntradas() {
    startTransition(async () => {
      await abrirAfiliado();
      recordar();
    });
  }

  /**
   * Un favorito ya guardado no tiene nada más que hacer, pero una reserva sí: el
   * usuario puede querer volver a abrir el enlace del proveedor más adelante. Como
   * guardar ya es idempotente (migración 0009), reabrirlo no duplica nada.
   */
  const bloqueado = done && !esReservable;

  return { esReservable, tieneEntradas, done, bloqueado, isPending, guardar, verEntradas };
}
