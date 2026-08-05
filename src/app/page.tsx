import Link from "next/link";
import { Zap } from "lucide-react";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { AppPreview } from "@/components/landing/app-preview";
import { createClient } from "@/lib/supabase/server";

const EJEMPLOS = [
  "Finde en Lisboa con 100€",
  "Interrail 10 días por Europa",
  "Roma 3 días desde Barcelona",
  "Escapada solo con 50€",
];

/**
 * Trucos del banco que usa el propio modelo (ver lib/ai/prompts.ts). Se enseñan tal cual
 * porque son la diferencia real del producto: la landing anterior los mencionaba de pasada
 * ("trucos de ahorro reales") sin enseñar ni uno.
 */
const TRUCOS = [
  "Pide una bolsa en el Duty Free y mete ahí lo que no te cabe: lo que compras en el aeropuerto no cuenta como tu bulto de mano.",
  "Regístrate gratis en ALSA Plus. Te quita los gastos de gestión y te mandan descuentos al correo, también por tu cumpleaños.",
  "Bus nocturno: te ahorras la noche de hostal y amaneces en el destino. Dos gastos en uno.",
  "Con la tarjeta ESN llevas un 10% en FlixBus. Si estudias, ya la tienes medio pagada.",
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // con sesión iniciada, la landing lleva a la app en vez de invitar a registrarse
  const destino = user ? "/mis-viajes" : "/registro";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between bg-brand px-4 text-white sm:px-6">
        <Link href={user ? "/mis-viajes" : "/"}>
          <Logo size={28} light textClassName="text-base sm:text-lg" />
        </Link>
        <Link
          href={user ? "/mis-viajes" : "/login"}
          className="rounded-full border border-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-white hover:text-brand-dark sm:px-5"
        >
          {user ? "Mis viajes" : "Iniciar sesión"}
        </Link>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 pb-14 pt-16 text-center sm:pb-16 sm:pt-20">
          <h1 className="text-pretty text-4xl font-black leading-[1.05] tracking-tight text-stone-900 sm:text-6xl">
            Dime cuánto tienes.
            <br />
            Te monto el viaje.
          </h1>
          <p className="max-w-xl text-pretty text-lg leading-relaxed text-stone-600">
            Cuéntale tu plan a la IA como se lo contarías a un colega. Te devuelve un itinerario
            con sitios concretos, todos marcados en el mapa, y los trucos para que salga por
            bastante menos.
          </p>
          <Link
            href={destino}
            className="rounded-full bg-brand px-8 py-4 text-base font-bold text-white shadow-lg shadow-brand/25 transition-colors hover:bg-brand-dark"
          >
            {user ? "Ir a mis viajes" : "Empezar viaje"}
          </Link>

          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            {EJEMPLOS.map((ejemplo) => (
              <Link
                key={ejemplo}
                href={destino}
                className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 transition-colors hover:border-brand hover:text-brand-dark"
              >
                {ejemplo}
              </Link>
            ))}
          </div>
        </section>

        {/* La prueba: en vez de describir el producto con tres iconos, se enseña. */}
        <section className="border-t border-stone-100 bg-stone-50 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto mb-8 max-w-2xl text-center">
              <h2 className="text-2xl font-black tracking-tight text-stone-900 sm:text-3xl">
                Esto es lo que te devuelve
              </h2>
              <p className="mt-2 text-stone-600">
                Un plan por horas, lo que cuesta de verdad y cada sitio marcado en el mapa. Sin
                salir de la conversación.
              </p>
            </div>

            <AppPreview />

            <p className="mt-4 text-center text-xs text-stone-400">
              Conversación de ejemplo. Cada viaje genera la suya con tus fechas y tu presupuesto.
            </p>
          </div>
        </section>

        {/* El diferenciador, con su propio material: el bloque oscuro del truco a escala de página. */}
        <section className="bg-stone-900 px-4 py-16 text-white sm:px-6 sm:py-24">
          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-16">
            <div className="lg:sticky lg:top-8 lg:self-start">
              <h2 className="text-pretty text-2xl font-black leading-tight tracking-tight sm:text-4xl">
                No te decimos dónde reservar. Te decimos cómo pagar menos.
              </h2>
              <p className="mt-4 text-pretty leading-relaxed text-stone-400">
                La IA suelta el truco cuando viene al caso, dentro del plan. Estos son de los que
                lleva de serie:
              </p>
            </div>

            <ul className="divide-y divide-white/10">
              {TRUCOS.map((truco) => (
                <li key={truco} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                  <Zap
                    size={18}
                    strokeWidth={2.5}
                    aria-hidden
                    className="mt-0.5 shrink-0 text-brand"
                  />
                  <p className="text-pretty leading-relaxed text-stone-200">{truco}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-6 py-16 text-center sm:py-20">
          <h2 className="text-pretty text-2xl font-black tracking-tight text-stone-900 sm:text-3xl">
            ¿Listo para tu próxima escapada barata?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-stone-600">
            Cuéntanos lo básico y tienes la primera propuesta en unos segundos.
          </p>
          <Link
            href={destino}
            className="mt-7 inline-block rounded-full bg-brand px-8 py-4 text-base font-bold text-white shadow-lg shadow-brand/25 transition-colors hover:bg-brand-dark"
          >
            {user ? "Ir a mis viajes" : "Crear cuenta gratis"}
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
