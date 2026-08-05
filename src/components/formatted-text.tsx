import { Fragment, type ReactNode } from "react";
import { Zap } from "lucide-react";

/**
 * Renderiza las respuestas de la IA.
 *
 * El modelo ya devuelve texto con estructura (horas del itinerario, listas con guion,
 * secciones acabadas en dos puntos, totales y trucos de ahorro), pero antes se pintaba
 * todo como un único bloque de texto plano donde "22:15 - Llegada" pesaba lo mismo que
 * el truco de ahorro, que es lo más valioso que produce el producto. Aquí ese contenido
 * se reconoce y recupera la jerarquía que ya venía escrita.
 *
 * El truco viaja marcado con [TRUCO]...[/TRUCO] desde el prompt (ver lib/ai/prompts.ts).
 * También se detecta la forma antigua ("Truco hacker: ...") para que las conversaciones
 * ya guardadas se vean igual de bien sin tocar la base de datos.
 */

type Bloque =
  | { tipo: "truco"; texto: string }
  | { tipo: "titulo"; texto: string }
  | { tipo: "total"; etiqueta: string; valor: string }
  | { tipo: "lista"; items: string[] }
  | { tipo: "agenda"; items: { hora: string; texto: string }[] }
  | { tipo: "parrafo"; texto: string };

const RE_TRUCO_TAG = /\[TRUCO\]([\s\S]*?)\[\/TRUCO\]/gi;
/** Forma antigua, aún presente en mensajes ya guardados: "**Truco hacker...:** texto". */
const RE_TRUCO_LEGACY = /^\s*\*{0,2}(truco[^:*]{0,40}?)\*{0,2}\s*:\s*\*{0,2}\s*(.+)$/i;
const RE_ITEM = /^\s*(?:[-–—•]|\*(?!\*))\s+(.+)$/;
const RE_HORA = /^\s*\*{0,2}(\d{1,2}[:.]\d{2})\s*(?:h|AM|PM)?\*{0,2}\s*[-–—:]?\s*(.*)$/i;
const RE_TOTAL = /^\s*\*{0,2}(total[^:*]{0,30}?)\*{0,2}\s*:\s*\*{0,2}(.+?)\*{0,2}\s*$/i;
const RE_TITULO = /^\s*\*{0,2}([^*:]{3,60}):\*{0,2}\s*$/;

/**
 * Cuando el modelo pone en negrita una línea entera ("**Total: 60€-71€**") y nosotros la
 * partimos por los dos puntos, uno de los trozos se queda con media negrita. Ese `**`
 * huérfano llegaba a pantalla como asteriscos literales, así que se quita.
 */
function limpiar(texto: string): string {
  const t = texto.trim();
  const marcas = t.match(/\*\*/g)?.length ?? 0;
  if (marcas % 2 === 0) return t;
  // sobra una marca: la del principio si abre, y si no, la última que quedó abierta
  const sinHuerfana = t.startsWith("**") ? t.slice(2) : t.replace(/\*\*(?![\s\S]*\*\*)/, "");
  return sinHuerfana.trim();
}

/** Parte el texto alternando lo normal y lo que va dentro de [TRUCO]. */
function separarTrucos(texto: string): { esTruco: boolean; contenido: string }[] {
  const segmentos: { esTruco: boolean; contenido: string }[] = [];
  let ultimo = 0;

  for (const match of texto.matchAll(RE_TRUCO_TAG)) {
    const inicio = match.index ?? 0;
    if (inicio > ultimo) segmentos.push({ esTruco: false, contenido: texto.slice(ultimo, inicio) });
    segmentos.push({ esTruco: true, contenido: match[1].trim() });
    ultimo = inicio + match[0].length;
  }

  if (ultimo < texto.length) segmentos.push({ esTruco: false, contenido: texto.slice(ultimo) });
  return segmentos;
}

function parsear(texto: string): Bloque[] {
  const bloques: Bloque[] = [];

  for (const segmento of separarTrucos(texto)) {
    if (segmento.esTruco) {
      if (segmento.contenido) bloques.push({ tipo: "truco", texto: segmento.contenido });
      continue;
    }

    // Una línea en blanco separa ideas en el texto del modelo: corta el grupo en curso
    // para que dos listas seguidas no se fundan en una sola.
    let cortado = false;

    for (const linea of segmento.contenido.split("\n")) {
      if (!linea.trim()) {
        cortado = true;
        continue;
      }

      const anterior = cortado ? null : bloques.at(-1);
      cortado = false;

      const legacy = RE_TRUCO_LEGACY.exec(linea);
      if (legacy) {
        bloques.push({ tipo: "truco", texto: limpiar(legacy[2]) });
        continue;
      }

      const item = RE_ITEM.exec(linea);
      if (item) {
        if (anterior?.tipo === "lista") anterior.items.push(limpiar(item[1]));
        else bloques.push({ tipo: "lista", items: [limpiar(item[1])] });
        continue;
      }

      const total = RE_TOTAL.exec(linea);
      if (total) {
        bloques.push({ tipo: "total", etiqueta: limpiar(total[1]), valor: limpiar(total[2]) });
        continue;
      }

      const hora = RE_HORA.exec(linea);
      if (hora && hora[2].trim()) {
        const entrada = { hora: hora[1].replace(".", ":"), texto: limpiar(hora[2]) };
        if (anterior?.tipo === "agenda") anterior.items.push(entrada);
        else bloques.push({ tipo: "agenda", items: [entrada] });
        continue;
      }

      const titulo = RE_TITULO.exec(linea);
      if (titulo) {
        bloques.push({ tipo: "titulo", texto: limpiar(titulo[1]) });
        continue;
      }

      bloques.push({ tipo: "parrafo", texto: limpiar(linea) });
    }
  }

  return bloques;
}

/** Negritas de markdown, lo único que el prompt pide usar dentro de una línea. */
function Inline({ texto }: { texto: string }): ReactNode {
  return (
    <>
      {texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) => {
        const match = /^\*\*([^*]+)\*\*$/.exec(parte);
        return match ? (
          <strong key={i} className="font-bold text-stone-900">
            {match[1]}
          </strong>
        ) : (
          <Fragment key={i}>{parte}</Fragment>
        );
      })}
    </>
  );
}

/**
 * El truco es la pieza que un usuario le contaría a un amigo: se lleva el único
 * bloque oscuro de toda la conversación para que se reconozca de un vistazo.
 */
function Truco({ texto }: { texto: string }) {
  return (
    <div className="mt-4 rounded-2xl bg-stone-900 first:mt-0 px-4 py-3.5 shadow-sm shadow-stone-900/10">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand">
        <Zap size={13} strokeWidth={2.5} /> Truco
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-white [&_strong]:text-white">
        <Inline texto={texto} />
      </p>
    </div>
  );
}

export function FormattedText({ texto }: { texto: string }) {
  const bloques = parsear(texto);

  return (
    <div className="min-w-0">
      {bloques.map((bloque, i) => {
        switch (bloque.tipo) {
          case "truco":
            return <Truco key={i} texto={bloque.texto} />;

          case "titulo":
            return (
              <p key={i} className="mb-2 mt-5 text-sm font-bold text-stone-900 first:mt-0">
                <Inline texto={bloque.texto} />
              </p>
            );

          case "total":
            return (
              <p
                key={i}
                className="mt-3 flex items-baseline justify-between gap-3 rounded-xl bg-stone-100 px-3 py-2 first:mt-0"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  <Inline texto={bloque.etiqueta} />
                </span>
                <span className="text-base font-black tabular-nums text-stone-900">
                  <Inline texto={bloque.valor} />
                </span>
              </p>
            );

          case "lista":
            return (
              <ul key={i} className="mt-3 space-y-1.5 first:mt-0">
                {bloque.items.map((item, j) => (
                  <li key={j} className="flex gap-2 text-sm leading-relaxed text-stone-700">
                    <span
                      aria-hidden
                      className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-stone-400"
                    />
                    <span className="min-w-0 flex-1">
                      <Inline texto={item} />
                    </span>
                  </li>
                ))}
              </ul>
            );

          case "agenda":
            return (
              <div key={i} className="mt-3.5 first:mt-0">
                {bloque.items.map((item, j) => (
                  <div key={j} className="flex gap-3">
                    <span className="w-11 shrink-0 pt-px text-right text-xs font-bold tabular-nums text-brand-dark">
                      {item.hora}
                    </span>
                    <span className="relative min-w-0 flex-1 border-l border-stone-200 pb-2.5 pl-3.5 text-sm leading-relaxed text-stone-700">
                      <span
                        aria-hidden
                        className="absolute -left-[4px] top-[7px] h-[7px] w-[7px] rounded-full bg-brand"
                      />
                      <Inline texto={item.texto} />
                    </span>
                  </div>
                ))}
              </div>
            );

          default:
            return (
              <p key={i} className="mt-3 text-sm leading-relaxed text-stone-700 first:mt-0">
                <Inline texto={bloque.texto} />
              </p>
            );
        }
      })}
    </div>
  );
}
