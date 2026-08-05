import Link from "next/link";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";
import { PricingToggle } from "./pricing-toggle";

export default async function PremiumPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // esta página también es la de "gestionar suscripción": necesita saber si ya la tiene
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("subscription_status, subscription_current_period_end")
        .eq("id", user.id)
        .single<{ subscription_status: string; subscription_current_period_end: string | null }>()
    : { data: null };

  const isPremium = profile?.subscription_status === "premium";

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
              "Tu suscripción"
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
              ? "Tienes Premium activo. Aquí ves qué incluye cada plan y puedes cancelar cuando quieras."
              : "Traveler IA Pro te cierra el viaje hora por hora, con el presupuesto desglosado y la ruta ya optimizada."}
          </p>
        </div>

        <PricingToggle
          isPremium={isPremium}
          renuevaEl={profile?.subscription_current_period_end ?? null}
        />
      </main>
    </div>
  );
}
