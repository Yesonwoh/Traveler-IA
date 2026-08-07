"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { crearViajeDesdeIdea } from "@/actions/viajes";
import { Button } from "@/components/ui/button";
import { borrarIdeaPendiente, leerIdeaPendiente } from "@/lib/idea-pendiente";

/**
 * Recoge la idea que la persona escribió en la portada y monta el viaje con ella.
 *
 * Se ejecuta aquí y no en /registro porque este es el punto por el que pasan los
 * dos caminos de entrada: el registro con email y la vuelta de Google. Si no hay
 * idea guardada no pinta nada, que es el caso de casi todas las visitas.
 */
export function RetomarIdea() {
  const [idea, setIdea] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creando, startTransition] = useTransition();
  // React monta los efectos dos veces en desarrollo; sin esto se crearían dos viajes.
  const lanzado = useRef(false);

  useEffect(() => {
    if (lanzado.current) return;
    const guardada = leerIdeaPendiente();
    if (!guardada) return;

    lanzado.current = true;
    // se borra antes de llamar: si algo falla, el reintento es explícito y no
    // se vuelve a disparar solo al recargar
    borrarIdeaPendiente();
    // sessionStorage no existe en el servidor, así que leerlo durante el render
    // rompería la hidratación. Sincronizar con un sistema externo del navegador
    // una sola vez, con guarda, es justo el caso que la regla deja fuera.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIdea(guardada);
    lanzar(guardada);
  }, []);

  function lanzar(texto: string) {
    setError(null);
    startTransition(async () => {
      // si sale bien, la acción redirige al chat y esto no llega a ejecutarse
      const res = await crearViajeDesdeIdea(texto);
      if (res?.error) setError(res.error);
    });
  }

  if (!idea) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 px-6 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm text-center">
        {error ? (
          <>
            <h2 className="text-xl font-bold text-stone-900">No hemos podido montarlo</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{error}</p>
            <p className="mt-4 rounded-xl bg-stone-100 px-4 py-3 text-left text-sm text-stone-700">
              {idea}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button onClick={() => lanzar(idea)} disabled={creando}>
                {creando ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden /> Probando otra vez
                  </>
                ) : (
                  "Intentarlo otra vez"
                )}
              </Button>
              <Button variant="ghost" onClick={() => setIdea(null)} disabled={creando}>
                Dejarlo y crear el viaje a mano
              </Button>
            </div>
          </>
        ) : (
          <>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white">
              <Sparkles size={24} aria-hidden />
            </span>
            <h2 className="mt-5 text-xl font-bold text-stone-900">Montando tu viaje</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              Buscando destino, precios y sitios concretos. Tarda unos segundos.
            </p>
            <p className="mt-5 rounded-xl bg-stone-100 px-4 py-3 text-left text-sm text-stone-700">
              {idea}
            </p>
            <Loader2
              size={20}
              aria-hidden
              className="mx-auto mt-6 animate-spin text-stone-400"
            />
          </>
        )}
      </div>
    </div>
  );
}
