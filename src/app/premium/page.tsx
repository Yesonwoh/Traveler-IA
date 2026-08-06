import Link from "next/link";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";
import { tienePruebaDisponible } from "@/lib/suscripcion/elegibilidad";
import {
  DIAS_PRUEBA,
  diasRestantesDePrueba,
  fechaLarga,
  leerEstadoPrueba,
  primerCobroSiEmpiezaHoy,
} from "@/lib/suscripcion/prueba";
import { PricingToggle } from "./pricing-toggle";

type PerfilSuscripcion = {
  subscription_status: string;
  subscription_current_period_end: string | null;
  stripe_customer_id: string | null;
};

export default async function PremiumPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // esta página también es la de "gestionar suscripción": necesita saber si ya la tiene
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("subscription_status, subscription_current_period_end, stripe_customer_id")
        .eq("id", user.id)
        .single<PerfilSuscripcion>()
    : { data: null };

  const isPremium = profile?.subscription_status === "premium";

  // Las columnas de la prueba viven en la migración 0011 y se leen aparte para que la
  // página siga funcionando si esa migración todavía no está aplicada.
  const { finaliza } = user ? await leerEstadoPrueba(supabase, user.id) : { finaliza: null };
  const diasDePrueba = isPremium ? diasRestantesDePrueba(finaliza) : null;

  // Solo se promete la prueba a quien de verdad la va a recibir: la misma comprobación
  // que hace el checkout, para que la página no pueda prometer lo que Stripe no dará.
  const puedeProbar =
    !isPremium && user
      ? await tienePruebaDisponible(supabase, user.id, profile?.stripe_customer_id ?? null)
      : false;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="flex h-16 items-center justify-between border-b border-stone-200 bg-white px-4 sm:px-6">
        <Link href="/">
          <Logo size={28} textClassName="text-base sm:text-lg" />
        </Link>
        <Link href="/mis-viajes" className="text-sm font-semibold text-stone-500 hover:text-brand">
          Volver a la app
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-14 sm:pt-20">
        <div className="mb-11 text-center">
          <h1 className="text-pretty text-4xl font-black leading-[1.05] tracking-tight text-stone-900 sm:text-5xl">
            {isPremium ? (
              diasDePrueba ? (
                "Estás probando Pro"
              ) : (
                "Tu suscripción"
              )
            ) : puedeProbar ? (
              <>
                Tres días en modo VIP,
                <br />
                invita la casa.
              </>
            ) : (
              <>
                Exprime cada céntimo,
                <br />
                en modo VIP.
              </>
            )}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-pretty text-lg leading-relaxed text-stone-600">
            {isPremium
              ? diasDePrueba && finaliza
                ? `Te ${diasDePrueba === 1 ? "queda 1 día" : `quedan ${diasDePrueba} días`}. El ${fechaLarga(finaliza)} empieza el cobro y, si cancelas antes, no pagas nada.`
                : "Tienes Premium activo. Aquí ves qué incluye cada plan y puedes cancelar cuando quieras."
              : puedeProbar
                ? `Traveler IA Pro te cierra el viaje hora por hora, con el presupuesto desglosado y la ruta ya optimizada. Si en ${DIAS_PRUEBA} días no te convence, cancelas y no pagas nada.`
                : "Traveler IA Pro te cierra el viaje hora por hora, con el presupuesto desglosado y la ruta ya optimizada."}
          </p>
        </div>

        <PricingToggle
          isPremium={isPremium}
          renuevaEl={profile?.subscription_current_period_end ?? null}
          puedeProbar={puedeProbar}
          diasPrueba={DIAS_PRUEBA}
          diasDePrueba={diasDePrueba}
          finPrueba={diasDePrueba && finaliza ? fechaLarga(finaliza) : null}
          primerCobro={puedeProbar ? primerCobroSiEmpiezaHoy() : null}
        />
      </main>
    </div>
  );
}
