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

  /** Crea la reserva (con su enlace de afiliado) y devuelve la URL, sin abrir nada. */
  async function anotarReserva() {
    const { urlAfiliado } = await guardarReserva({
      viajeId,
      recomendacionId: recomendacion.id,
      tipo: recomendacion.tipo as never,
      nombre: recomendacion.nombre,
      direccion: recomendacion.direccion,
      countryCode: recomendacion.countryCode,
    });
    return urlAfiliado;
  }

  async function abrirAfiliado() {
    const urlAfiliado = await anotarReserva();
    if (urlAfiliado) window.open(urlAfiliado, "_blank", "noopener,noreferrer");
  }

  async function anotarFavorito() {
    await agregarFavorito({
      viajeId,
      recomendacionId: recomendacion.id,
      nombre: recomendacion.nombre,
      direccion: recomendacion.direccion,
      lat: recomendacion.lat,
      lng: recomendacion.lng,
    });
  }

  /**
   * Guardar un sitio lo mete SIEMPRE en Favoritos, y además en Reservas si se puede
   * comprar.
   *
   * Antes eran dos destinos excluyentes: un museo caía solo en Favoritos y no había
   * forma de encontrar su entrada después, y una actividad caía solo en Reservas y
   * desaparecía de la lista de sitios que quieres ver. Las dos pestañas responden a
   * preguntas distintas —"qué quiero ver" y "qué me falta por comprar"— y un mismo
   * sitio puede estar en las dos.
   */
  function guardar() {
    startTransition(async () => {
      if (esReservable) {
        // El botón dice "Reservar": abrir el proveedor es la acción que pidió.
        // Las dos escrituras van en paralelo a propósito — encadenarlas retrasaría
        // el window.open y algunos navegadores lo tratarían como un popup y lo
        // bloquearían, que en esta tarjeta es justo donde está la comisión.
        const [, urlAfiliado] = await Promise.all([anotarFavorito(), anotarReserva()]);
        if (urlAfiliado) window.open(urlAfiliado, "_blank", "noopener,noreferrer");
      } else if (tieneEntradas) {
        // El botón dice "Guardar", así que no se le abre una pestaña sin avisar: la
        // entrada queda anotada en Reservas y se compra desde allí o desde "Entradas".
        await Promise.all([anotarFavorito(), anotarReserva()]);
      } else {
        await anotarFavorito();
      }

      recordar();
    });
  }

  /** Compra de entrada para monumentos: no sustituye a guardarlo en Favoritos. */
  function verEntradas() {
    startTransition(async () => {
      // también entra en Favoritos: si alguien va directo a por la entrada, el sitio
      // debe aparecer igualmente en su lista de "qué quiero ver"
      await Promise.all([anotarFavorito(), abrirAfiliado()]);
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
