"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { guardarIdeaPendiente, IDEA_MAX_CARACTERES } from "@/lib/idea-pendiente";
import { cn } from "@/lib/utils";

/**
 * Ejemplos que se escriben en el campo, no enlaces disfrazados. Antes eran cuatro
 * `<Link>` a /registro: parecían sugerencias de un buscador y llevaban a un muro
 * de registro, que es justo lo que el tráfico frío castiga.
 *
 * El último no lleva destino a propósito: mucha gente llega sin saber a dónde va,
 * y esa es la conversación que mejor se le da al producto.
 */
const EJEMPLOS = [
  "Finde en Lisboa con 100€",
  "Interrail 10 días por Europa",
  "Roma 3 días desde Barcelona",
  "Me da igual dónde, tengo 50€",
];

const MINIMO = 3;

export function IdeaHero({ destino }: { destino: string }) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const campo = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const listo = texto.trim().length >= MINIMO;

  function escribir(valor: string) {
    setTexto(valor.slice(0, IDEA_MAX_CARACTERES));
    const el = campo.current;
    if (!el) return;
    // crece con el texto en vez de mostrar una barra de scroll dentro del hero
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }

  function usarEjemplo(ejemplo: string) {
    escribir(ejemplo);
    const el = campo.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(ejemplo.length, ejemplo.length);
  }

  function enviar() {
    if (enviando) return;
    // El botón nunca se pinta apagado: un CTA gris en la primera pantalla dice
    // "esto no se puede usar" antes de que nadie lo haya intentado. Si aún no hay
    // texto, la pulsación lleva al campo en vez de no hacer nada.
    if (!listo) {
      campo.current?.focus();
      return;
    }
    setEnviando(true);
    // El viaje se crea al otro lado (en /mis-viajes), ya con sesión: así el mismo
    // camino sirve para quien entra con email y para quien vuelve de Google.
    guardarIdeaPendiente(texto.trim());
    router.push(destino);
  }

  return (
    <div className="w-full max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
        className="rounded-2xl border border-stone-300 bg-white text-left shadow-sm transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20"
      >
        <label htmlFor="idea-viaje" className="sr-only">
          Cuéntanos tu viaje
        </label>
        <textarea
          id="idea-viaje"
          ref={campo}
          value={texto}
          onChange={(e) => escribir(e.target.value)}
          onKeyDown={(e) => {
            // convención de chat: Enter envía, Mayús+Enter hace salto de línea
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar();
            }
          }}
          rows={2}
          maxLength={IDEA_MAX_CARACTERES}
          disabled={enviando}
          placeholder="Finde en Sevilla saliendo de Granada, tengo 80€ contando todo"
          /* text-base y no menos: por debajo de 16px iOS hace zoom al enfocar */
          className="w-full resize-none bg-transparent px-4 pt-4 text-base leading-relaxed text-stone-900 outline-none placeholder:text-stone-500 disabled:opacity-60 sm:px-5 sm:pt-5"
        />

        <div className="flex flex-col gap-3 px-4 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:pb-5">
          <p className="text-sm text-stone-500">
            {texto.length > IDEA_MAX_CARACTERES - 100
              ? `Te quedan ${IDEA_MAX_CARACTERES - texto.length} caracteres`
              : "Gratis y sin tarjeta."}
          </p>
          <button
            type="submit"
            disabled={enviando}
            className={cn(
              "inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-6 text-base font-bold text-white transition-colors sm:h-11 sm:w-auto sm:text-sm",
              "bg-brand hover:bg-brand-dark",
              "disabled:cursor-not-allowed disabled:opacity-70"
            )}
          >
            {enviando ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden /> Vamos allá
              </>
            ) : (
              <>
                Montar el viaje
                <ArrowRight size={18} aria-hidden />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {EJEMPLOS.map((ejemplo) => (
          <button
            key={ejemplo}
            type="button"
            onClick={() => usarEjemplo(ejemplo)}
            disabled={enviando}
            className="cursor-pointer rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 transition-colors hover:border-brand hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {ejemplo}
          </button>
        ))}
      </div>
    </div>
  );
}
