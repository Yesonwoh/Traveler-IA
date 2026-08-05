import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { leerPerfil } from "@/lib/supabase/perfil";
import { AvatarUpload } from "./avatar-upload";
import { PerfilForm } from "./perfil-form";
import { PreferenciasForm } from "./preferencias-form";
import { SuscripcionCard } from "./suscripcion-card";
import { CuentaSection } from "./cuenta-section";

type Perfil = {
  nombre: string | null;
  telefono: string | null;
  subscription_status: string | null;
  subscription_current_period_end: string | null;
  ubicacion: string | null;
  fecha_nacimiento: string | null;
  foto_perfil_url: string | null;
  intereses?: string[] | null;
  presupuesto_estilo?: string | null;
  tipo_alojamiento?: string | null;
  ritmo_viaje?: string | null;
  notas_viaje?: string | null;
};

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const BASE_COLUMNS =
    "nombre, telefono, subscription_status, subscription_current_period_end, ubicacion, fecha_nacimiento, foto_perfil_url";

  const profile = await leerPerfil<Perfil>(
    supabase,
    user!.id,
    `${BASE_COLUMNS}, intereses, presupuesto_estilo, tipo_alojamiento, ritmo_viaje, notas_viaje`,
    BASE_COLUMNS
  );

  const isPremium = profile?.subscription_status === "premium";
  const inicial = (profile?.nombre || user!.email || "?").charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Configuración</h1>
        <p className="mt-1 text-stone-500">{user!.email}</p>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <AvatarUpload fotoUrl={profile?.foto_perfil_url ?? ""} inicial={inicial} isPremium={isPremium} />
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Perfil
        </h2>
        <PerfilForm nombre={profile?.nombre ?? ""} telefono={profile?.telefono ?? ""} />
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Preferencias de viaje
        </h2>
        <p className="mb-4 text-xs text-stone-400">
          Opcional — ayuda a la IA a proponerte mejores planes desde el primer mensaje.
        </p>
        <PreferenciasForm
          ubicacion={profile?.ubicacion ?? ""}
          fechaNacimiento={profile?.fecha_nacimiento ?? ""}
          intereses={profile?.intereses ?? []}
          presupuestoEstilo={profile?.presupuesto_estilo ?? ""}
          tipoAlojamiento={profile?.tipo_alojamiento ?? ""}
          ritmoViaje={profile?.ritmo_viaje ?? ""}
          notasViaje={profile?.notas_viaje ?? ""}
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Suscripción
        </h2>
        <SuscripcionCard
          isPremium={isPremium}
          renuevaEl={profile?.subscription_current_period_end ?? null}
        />
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Cuenta
        </h2>
        <CuentaSection />
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Legal
        </h2>
        <div className="divide-y divide-stone-100">
          {[
            { href: "/terminos", label: "Términos de servicio" },
            { href: "/privacidad", label: "Política de privacidad" },
            { href: "/cookies", label: "Política de cookies" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-between py-3 text-sm text-stone-700 transition-colors first:pt-0 last:pb-0 hover:text-brand"
            >
              {label}
              <ChevronRight size={16} className="text-stone-300" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
