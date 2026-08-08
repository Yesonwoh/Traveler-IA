"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Check, Zap, Loader2 } from "lucide-react";
import { crearCheckoutSession, crearPortalSession } from "@/actions/stripe";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Precios reales de PRICE_IDS. El ahorro anual es aritmética, no marketing:
 * 4,99 × 12 = 59,88 € frente a 39 € = 20,88 € menos (un 35%).
 */
const PRECIO = {
  monthly: { importe: "4,99€", periodo: "/mes", pie: "Se renueva cada mes" },
  yearly: { importe: "39€", periodo: "/año", pie: "Te ahorras 20,88€ frente al mensual" },
} as const;

const TITULAR_TARJETA = "mt-3 text-4xl font-black tracking-tight text-white";

/**
 * Entre 640 y 660 px la rejilla ya son dos columnas pero el contenedor aún no ha
 * llegado a su ancho máximo, y a la tarjeta le quedan 238 px útiles. Medido con la
 * tipografía real: "3 días gratis" ocupa 215 px a 36 px y entra; "Quedan 3 días"
 * se va a 248 px y se sale. Solo ese baja de tamaño, y solo en esa franja.
 */
const TITULAR_LARGO = "sm:text-[1.8rem] md:text-4xl";

export function PricingToggle({
  isPremium = false,
  renuevaEl = null,
  puedeProbar = false,
  diasPrueba,
  diasDePrueba = null,
  finPrueba = null,
  primerCobro = null,
}: {
  isPremium?: boolean;
  /** Fin del periodo actual, para decirle al usuario hasta cuándo tiene Premium. */
  renuevaEl?: string | null;
  /** Le corresponde la prueba gratuita. Ya verificado contra Stripe en el servidor. */
  puedeProbar?: boolean;
  /** Duración de la prueba (DIAS_PRUEBA), para no repetir el número en el copy. */
  diasPrueba: number;
  /** Días que le quedan de prueba en curso, si está dentro de una. */
  diasDePrueba?: number | null;
  /** Día en que se acaba la prueba en curso, ya formateado ("9 de agosto"). */
  finPrueba?: string | null;
  /** Día del primer cobro si empezara la prueba hoy, ya formateado. */
  primerCobro?: string | null;
}) {
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [isPending, startTransition] = useTransition();

  const enPrueba = isPremium && diasDePrueba !== null;

  return (
    <div>
      {/* Con la suscripción activa, elegir mensual/anual no viene a cuento: el cambio
          de plan se hace desde el portal de Stripe, no desde aquí. */}
      {!isPremium && (
        <div className="mx-auto mb-10 flex w-fit items-center gap-1 rounded-full border border-stone-200 bg-white p-1 shadow-sm">
          <OpcionPlan activo={plan === "monthly"} onClick={() => setPlan("monthly")}>
            Mensual
          </OpcionPlan>
          <OpcionPlan activo={plan === "yearly"} onClick={() => setPlan("yearly")}>
            Anual
            <span
              className={cn(
                // el verde significa ahorro y lo sigue significando al activarse: solo
                // sube de intensidad. En naranja competía con la marca y, en blanco
                // sobre naranja, el contraste se quedaba en 2,9:1.
                "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                plan === "yearly" ? "bg-emerald-400 text-emerald-950" : "bg-emerald-100 text-emerald-700"
              )}
            >
              -35%
            </span>
          </OpcionPlan>
        </div>
      )}

      {/* Premium va primero en móvil: es la tarjeta que tiene que llevarse la mirada */}
      <div className="grid items-start gap-5 sm:grid-cols-2">
        {/* ── Free ─────────────────────────────────────────────────────────── */}
        <div className="relative order-2 rounded-3xl border border-stone-200 bg-white p-7 sm:order-1">
          {!isPremium && <Etiqueta tono="claro">Tu plan actual</Etiqueta>}

          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-500">Free</p>
          <p className="mt-3 text-4xl font-black tracking-tight text-stone-900">0€</p>
          <p className="mt-1 text-sm text-stone-500">Para siempre, sin tarjeta</p>

          <ul className="mt-7 space-y-3.5 text-sm text-stone-600">
            <Rasgo>IA con trucos de ahorro al instante</Rasgo>
            <Rasgo>Planes por franjas del día y precios orientativos</Rasgo>
            <Rasgo>Mapa y tarjetas de recomendaciones</Rasgo>
            <Rasgo>Favoritos y reservas ilimitadas</Rasgo>
          </ul>
        </div>

        {/* ── Premium ──────────────────────────────────────────────────────── */}
        <div className="relative order-1 overflow-hidden rounded-3xl bg-stone-900 p-7 shadow-xl shadow-stone-900/25 sm:order-2">
          {/* halo cálido: el mismo naranja de marca, como luz y no como relleno */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-brand/25 blur-3xl"
          />

          <div className="relative">
            <Etiqueta tono="oscuro">
              {enPrueba
                ? "Prueba en curso"
                : isPremium
                  ? "Tu plan actual"
                  : puedeProbar
                    ? `${diasPrueba} días gratis`
                    : "Recomendado"}
            </Etiqueta>

            <p className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-[0.14em] text-brand">
              <Zap size={14} strokeWidth={2.5} /> Premium
            </p>

            {isPremium ? (
              <>
                <p className={cn(TITULAR_TARJETA, enPrueba && TITULAR_LARGO)}>
                  {enPrueba
                    ? diasDePrueba === 1
                      ? "Queda 1 día"
                      : `Quedan ${diasDePrueba} días`
                    : "Activo"}
                </p>
                <p className="mt-1 text-sm text-stone-400">
                  {enPrueba && finPrueba
                    ? `El ${finPrueba} empieza el cobro`
                    : renuevaEl
                      ? `Se renueva el ${new Date(renuevaEl).toLocaleDateString("es-ES")}`
                      : "Suscripción en marcha"}
                </p>
              </>
            ) : puedeProbar ? (
              <>
                {/* Con prueba, el número que manda son los días gratis: el precio pasa a
                    ser la letra pequeña honesta, no el titular. */}
                <p className={TITULAR_TARJETA}>{diasPrueba} días gratis</p>
                {/* El precio pasa a segundo plano, pero no a letra pequeña: quien va a
                    dar su tarjeta tiene que ver qué se le va a cobrar sin buscarlo. */}
                <p key={plan} className="animate-precio mt-1 text-base text-stone-300">
                  Luego {PRECIO[plan].importe}
                  {PRECIO[plan].periodo}
                  {plan === "yearly" && " · te ahorras 20,88€"}
                </p>
              </>
            ) : (
              <>
                <p
                  key={plan}
                  className="mt-3 animate-precio text-5xl font-black tracking-tight text-white"
                >
                  {PRECIO[plan].importe}
                  <span className="ml-1 text-lg font-medium text-stone-400">
                    {PRECIO[plan].periodo}
                  </span>
                </p>
                <p className="mt-1 text-sm text-stone-400">{PRECIO[plan].pie}</p>
              </>
            )}

            <ul className="mt-7 space-y-3.5 text-sm text-stone-200">
              <Rasgo oscuro>Todo lo de Free</Rasgo>
              <Rasgo oscuro>
                <strong className="font-semibold text-white">Traveler IA Pro</strong>: el motor
                de IA superior
              </Rasgo>
              <Rasgo oscuro>Itinerarios hora por hora con presupuesto desglosado</Rasgo>
              <Rasgo oscuro>Ruta optimizada y plan B más barato</Rasgo>
              <Rasgo oscuro>Trucos específicos de cada destino</Rasgo>
            </ul>

            {isPremium ? (
              <form action={crearPortalSession} className="mt-8">
                <input type="hidden" name="retorno" value="/premium" />
                <button
                  type="submit"
                  className="h-12 w-full cursor-pointer rounded-xl border border-white/25 text-sm font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/10"
                >
                  {enPrueba ? "Cancelar la prueba" : "Cancelar suscripción"}
                </button>
                <p className="mt-2.5 text-center text-xs leading-relaxed text-stone-400">
                  {enPrueba && finPrueba
                    ? `Se abre el portal seguro de Stripe. Si cancelas antes del ${finPrueba}, no se te cobra nada.`
                    : "Se abre el portal seguro de Stripe, donde también puedes cambiar de plan o de método de pago."}
                </p>
              </form>
            ) : (
              <>
                <Button
                  onClick={() => startTransition(() => crearCheckoutSession(plan))}
                  disabled={isPending}
                  className="mt-8 h-12 w-full text-base shadow-lg shadow-brand/25"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={17} className="animate-spin" /> Redirigiendo...
                    </>
                  ) : puedeProbar ? (
                    // los días ya los dicen la etiqueta, el titular y la nota de abajo:
                    // el botón solo tiene que nombrar la acción y caber en una línea
                    "Empezar gratis"
                  ) : (
                    "Hazte Premium"
                  )}
                </Button>
                {puedeProbar && primerCobro && (
                  <p className="mt-2.5 text-center text-xs leading-relaxed text-stone-400">
                    Se pide tarjeta para activarla, pero no se cobra nada hasta el{" "}
                    {primerCobro}.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {!isPremium && (
        <div className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm text-stone-500">
          <Garantia>
            {puedeProbar && primerCobro ? `No pagas nada hasta el ${primerCobro}` : "Cancelas cuando quieras"}
          </Garantia>
          <Garantia>{puedeProbar ? "Cancelas cuando quieras" : "Sin permanencia"}</Garantia>
          <Garantia>Pago seguro con Stripe</Garantia>
        </div>
      )}
    </div>
  );
}

function OpcionPlan({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={activo}
      className={cn(
        "flex cursor-pointer items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition-colors",
        activo ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-900"
      )}
    >
      {children}
    </button>
  );
}

function Etiqueta({ tono, children }: { tono: "claro" | "oscuro"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "mb-4 inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em]",
        // texto casi negro sobre el naranja: en blanco se quedaba en 2,8:1 y esta
        // etiqueta es ahora la que anuncia la prueba, o sea lo que hay que poder leer
        tono === "oscuro" ? "bg-brand text-stone-950" : "bg-stone-100 text-stone-500"
      )}
    >
      {children}
    </span>
  );
}

function Rasgo({ children, oscuro = false }: { children: ReactNode; oscuro?: boolean }) {
  return (
    <li className="flex items-start gap-2.5 leading-relaxed">
      <Check
        size={16}
        strokeWidth={2.5}
        aria-hidden
        className={cn("mt-0.5 shrink-0", oscuro ? "text-brand" : "text-stone-400")}
      />
      <span className="min-w-0">{children}</span>
    </li>
  );
}

function Garantia({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <Check size={15} strokeWidth={2.5} aria-hidden className="text-emerald-600" />
      {children}
    </span>
  );
}
