import Link from "next/link";
import { Sparkles } from "lucide-react";
import { crearPortalSession } from "@/actions/stripe";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SuscripcionCard({
  isPremium,
  renuevaEl,
}: {
  isPremium: boolean;
  renuevaEl: string | null;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-stone-500">Tu plan</p>
          <p className="mt-1 flex items-center gap-2 text-lg font-bold text-stone-900">
            {isPremium ? (
              <>
                <Sparkles size={18} className="text-brand" /> Premium
              </>
            ) : (
              "Free"
            )}
          </p>
          {isPremium && renuevaEl && (
            <p className="mt-1 text-xs text-stone-400">
              Se renueva el {new Date(renuevaEl).toLocaleDateString("es-ES")}
            </p>
          )}
        </div>

        {isPremium ? (
          <form action={crearPortalSession}>
            <Button type="submit" variant="outline">
              Gestionar suscripción
            </Button>
          </form>
        ) : (
          <Link
            href="/premium"
            className={cn(
              "inline-flex h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            )}
          >
            Hazte premium
          </Link>
        )}
      </div>
    </div>
  );
}
