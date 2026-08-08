import Link from "next/link";
import { Sparkles } from "lucide-react";
import { crearPortalSession } from "@/actions/stripe";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SuscripcionCard({
  isPremium,
  renuevaEl,
  diasDePrueba = null,
  finPrueba = null,
  pruebaSinUsar = false,
  diasPrueba,
}: {
  isPremium: boolean;
  renuevaEl: string | null;
  /** Días que le quedan de prueba, si está dentro de una. */
  diasDePrueba?: number | null;
  /** Día en que acaba la prueba, ya formateado ("9 de agosto"). */
  finPrueba?: string | null;
  /** Todavía no ha gastado su prueba gratuita. */
  pruebaSinUsar?: boolean;
  /** Duración de la prueba (DIAS_PRUEBA). */
  diasPrueba: number;
}) {
  const enPrueba = isPremium && diasDePrueba !== null;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-stone-500">Tu plan</p>
          <p className="mt-1 flex items-center gap-2 text-lg font-bold text-stone-900">
            {isPremium ? (
              <>
                <Sparkles size={18} className="text-brand" />
                {enPrueba ? "Premium de prueba" : "Premium"}
              </>
            ) : (
              "Free"
            )}
          </p>

          {enPrueba ? (
            <p className="mt-1 text-xs text-stone-500">
              Te {diasDePrueba === 1 ? "queda 1 día" : `quedan ${diasDePrueba} días`}
              {finPrueba && ` · el ${finPrueba} empieza el cobro`}
            </p>
          ) : isPremium && renuevaEl ? (
            <p className="mt-1 text-xs text-stone-500">
              Se renueva el {new Date(renuevaEl).toLocaleDateString("es-ES")}
            </p>
          ) : (
            !isPremium &&
            pruebaSinUsar && (
              <p className="mt-1 text-xs text-stone-500">
                Tienes {diasPrueba} días de Premium sin estrenar
              </p>
            )
          )}
        </div>

        {isPremium ? (
          <form action={crearPortalSession}>
            <Button type="submit" variant="outline">
              {enPrueba ? "Gestionar prueba" : "Gestionar suscripción"}
            </Button>
          </form>
        ) : (
          <Link
            href="/premium"
            className={cn(
              "inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            )}
          >
            {pruebaSinUsar ? "Probar gratis" : "Hazte Premium"}
          </Link>
        )}
      </div>
    </div>
  );
}
