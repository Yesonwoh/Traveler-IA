import type { CSSProperties } from "react";
import { Bed, Bus, Church, Landmark, UtensilsCrossed, Zap, type LucideIcon } from "lucide-react";
import { EscenaAnimada } from "./escena-animada";

/**
 * Vista previa del producto para la landing.
 *
 * La landing vendía con tres iconos y texto genérico: no enseñaba ni el chat, ni el mapa,
 * ni un truco. Esto reproduce la pantalla real de un viaje con los mismos materiales que
 * usa la app (el bloque oscuro del truco, el carril del itinerario, el pin naranja con
 * anillo blanco), pero sin cargar Google Maps ni la IA en cada visita a la portada.
 *
 * El contenido es una conversación de ejemplo del tipo que produce el modelo. No afirma
 * ningún precio garantizado: habla de rangos, igual que hace la IA de verdad.
 *
 * Al entrar en pantalla se representa una vez, en el mismo orden en que trabaja el
 * producto: la pregunta, la respuesta, el itinerario dibujándose de arriba abajo, cada
 * parada aterrizando como pin en el mapa, y el truco al final. La conversación y el mapa
 * son dos escenas separadas porque en móvil no caben a la vez: en escritorio arrancan
 * juntas y se ve el acoplamiento; en móvil los pines caen cuando llegas al mapa.
 */

const PARADAS = [
  { hora: "08:30", texto: "Bus Granada → Sevilla. Sale antes de que abran las cafeterías, pero es el barato." },
  { hora: "11:00", texto: "Dejas la mochila en el hostal y directo al centro. El check-in es por la tarde." },
  { hora: "14:00", texto: "Comida de menú por el barrio, lejos de la catedral." },
  { hora: "20:30", texto: "Atardecer desde las Setas y cena de súper en la plaza." },
];

/**
 * El orden importa: los cuatro primeros son, uno a uno, las paradas de arriba, y por eso
 * cada pin cae justo detrás de su línea de itinerario. La catedral va suelta al final,
 * como el sitio que la IA deja caer de propina.
 */
const PINES: { icono: LucideIcon; x: number; y: number; etiqueta: string }[] = [
  { icono: Bus, x: 20, y: 30, etiqueta: "Estación Plaza de Armas" },
  { icono: Bed, x: 40, y: 55, etiqueta: "Black Swan Hostel" },
  { icono: UtensilsCrossed, x: 62, y: 43, etiqueta: "Veganitessen" },
  { icono: Landmark, x: 72, y: 66, etiqueta: "Setas de Sevilla" },
  { icono: Church, x: 47, y: 78, etiqueta: "Catedral de Sevilla" },
];

/**
 * Compás de la secuencia, en milisegundos. Está aquí y no en el CSS porque es una
 * decisión de guion, no de estilo: la hoja solo sabe cuánto dura cada gesto.
 */
const RITMO = {
  pregunta: 0,
  respuesta: 320,
  carril: 560,
  /** Primera parada, y lo que tarda en escribirse la siguiente. */
  parada: 620,
  paso: 120,
  /** Lo que tarda el pin en caer detrás de su parada. Ese desfase es el producto entero. */
  pin: 60,
  total: 1140,
  truco: 1300,
} as const;

/** El retardo de cada pieza viaja como variable CSS; el gesto lo pone globals.css. */
function retardo(ms: number): CSSProperties {
  return { "--d": `${ms}ms` } as CSSProperties;
}

export function AppPreview() {
  return (
    <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl shadow-stone-900/10">
      <div className="flex h-14 items-center gap-3 border-b border-stone-200 px-4">
        <div
          aria-hidden
          className="h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br from-brand to-brand-dark"
        />
        <p className="truncate text-sm font-bold text-stone-900">Finde barato en Sevilla</p>
        <span className="ml-auto hidden shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-500 sm:block">
          Chat IA
        </span>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <EscenaAnimada className="min-w-0 space-y-4 p-4 sm:p-5 lg:border-r lg:border-stone-200">
          <div className="flex justify-end">
            <p
              style={retardo(RITMO.pregunta)}
              className="vp-sube max-w-[85%] rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-sm leading-relaxed text-white"
            >
              Finde en Sevilla saliendo de Granada. Tengo 80€ contando todo.
            </p>
          </div>

          <div className="min-w-0">
            <p
              style={retardo(RITMO.respuesta)}
              className="vp-sube text-sm leading-relaxed text-stone-700"
            >
              Con 80€ sale, pero hay que jugarla bien. Te lo dejo cerrado:
            </p>

            {/* El carril era un `border-l` por parada. Ahora es una sola línea continua
                para poder dibujarla de arriba abajo: `left-14` la deja justo donde
                acababa ese borde (la hora mide w-11 y el hueco gap-3). */}
            <div className="relative my-2.5">
              <span
                aria-hidden
                style={retardo(RITMO.carril)}
                className="vp-carril absolute left-14 top-0 h-full w-px origin-top bg-stone-200"
              />

              {PARADAS.map(({ hora, texto }, i) => (
                <div
                  key={hora}
                  style={retardo(RITMO.parada + i * RITMO.paso)}
                  className="vp-sube flex gap-3"
                >
                  <span className="w-11 shrink-0 pt-px text-right text-xs font-bold tabular-nums text-brand-dark">
                    {hora}
                  </span>
                  <span className="relative min-w-0 flex-1 pb-2.5 pl-3.5 text-sm leading-relaxed text-stone-700">
                    <span
                      aria-hidden
                      style={retardo(RITMO.parada + i * RITMO.paso)}
                      className="vp-punto absolute -left-[4px] top-[7px] h-[7px] w-[7px] rounded-full bg-brand"
                    />
                    {texto}
                  </span>
                </div>
              ))}
            </div>

            <p
              style={retardo(RITMO.total)}
              className="vp-sube my-2 flex items-baseline justify-between gap-3 rounded-xl bg-stone-100 px-3 py-2"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Total estimado
              </span>
              <span className="text-base font-black tabular-nums text-stone-900">60€ – 71€</span>
            </p>

            <div
              style={retardo(RITMO.truco)}
              className="vp-truco my-3 rounded-2xl bg-stone-900 px-4 py-3.5"
            >
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand">
                <Zap size={13} strokeWidth={2.5} /> Truco
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-white">
                Coge el bus entre semana y duerme el finde: en Sevilla la noche de viernes sube
                más de lo que te ahorras esperando al sábado.
              </p>
            </div>
          </div>
        </EscenaAnimada>

        <MapaEjemplo />
      </div>
    </div>
  );
}

/**
 * Mapa dibujado a mano. Deliberadamente casi monocromo: el problema del mapa real era
 * que los POI de colores de Google competían con nuestros pines, así que aquí el único
 * color saturado es el naranja de las paradas del viaje.
 *
 * El plano se sirve puesto y solo caen los pines: el escenario ya está, lo que llega es
 * lo que ha dicho la IA.
 */
function MapaEjemplo() {
  return (
    <EscenaAnimada className="relative min-h-[260px] bg-stone-100 lg:min-h-0">
      <svg
        aria-hidden
        viewBox="0 0 340 420"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <rect width="340" height="420" fill="#f0efee" />

        {/* río */}
        <path
          d="M-20 0 C40 90 20 160 60 240 C90 300 70 360 40 440 L-40 440 L-40 0 Z"
          fill="#dbe4e9"
        />

        {/* parques */}
        <ellipse cx="268" cy="120" rx="52" ry="38" fill="#e2e7de" />
        <ellipse cx="120" cy="372" rx="62" ry="40" fill="#e2e7de" />

        {/* manzanas */}
        {[
          [92, 60, 54, 40], [158, 60, 46, 40], [216, 74, 38, 26],
          [96, 112, 48, 46], [156, 112, 48, 46], [214, 170, 44, 40],
          [88, 172, 40, 44], [140, 172, 52, 44], [204, 224, 50, 46],
          [96, 230, 46, 42], [152, 230, 44, 42], [212, 284, 46, 40],
          [104, 284, 50, 44], [166, 284, 40, 44], [156, 336, 48, 38],
          [222, 336, 44, 38], [258, 208, 40, 52], [262, 274, 36, 44],
        ].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx="3" fill="#e6e4e2" />
        ))}

        {/* viario */}
        <g stroke="#ffffff" fill="none" strokeLinecap="round">
          <path d="M70 96 H330" strokeWidth="7" />
          <path d="M60 210 H330" strokeWidth="9" />
          <path d="M78 268 H330" strokeWidth="6" />
          <path d="M84 322 H330" strokeWidth="7" />
          <path d="M148 40 V410" strokeWidth="8" />
          <path d="M200 40 V410" strokeWidth="6" />
          <path d="M254 60 V410" strokeWidth="7" />
          <path d="M96 60 C104 150 120 240 132 410" strokeWidth="5" />
        </g>
      </svg>

      {PINES.map(({ icono: Icono, x, y, etiqueta }, i) => (
        <div
          key={etiqueta}
          title={etiqueta}
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          {/* La capa de dentro es la que cae: la de fuera tiene que conservar el
              translate que la clava en su coordenada del mapa. */}
          <div
            style={retardo(RITMO.parada + RITMO.pin + i * RITMO.paso)}
            className="vp-pin flex flex-col items-center"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full border-[2.5px] border-white bg-brand"
              style={{ boxShadow: "0 2px 6px rgba(28,25,23,0.35)" }}
            >
              <Icono size={18} color="#ffffff" strokeWidth={2.5} />
            </div>
            <div
              className="-mt-[7px] h-3 w-3 rotate-45 rounded-[2px] bg-brand"
              style={{ boxShadow: "0 1px 2px rgba(28,25,23,0.28)" }}
            />
          </div>
        </div>
      ))}
    </EscenaAnimada>
  );
}
