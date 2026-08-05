"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  COOKIE_CONSENT_EVENT,
  guardarConsentimiento,
  leerConsentimiento,
} from "@/lib/cookie-consent";

export function CookieBanner() {
  // `null` = todavía no sabemos (evita parpadeo en el primer render del cliente).
  const [visible, setVisible] = useState<boolean | null>(null);
  const [entrado, setEntrado] = useState(false);

  useEffect(() => {
    function sincronizar() {
      setVisible(leerConsentimiento() === null);
    }
    sincronizar();
    window.addEventListener(COOKIE_CONSENT_EVENT, sincronizar);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, sincronizar);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const frame = requestAnimationFrame(() => setEntrado(true));
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  if (!visible) return null;

  function decidir(valor: "all" | "necessary") {
    setEntrado(false);
    guardarConsentimiento(valor);
  }

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className={`fixed inset-x-0 bottom-0 z-50 px-3 pb-3 transition-all duration-300 ease-out sm:px-4 sm:pb-4 ${
        entrado ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl sm:flex-row sm:items-center sm:p-5">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
            <Cookie size={18} />
          </span>
          <p className="text-sm leading-relaxed text-stone-600">
            Usamos cookies necesarias para que la web funcione y, si nos dejas, otras para entender
            cómo se usa y mejorarla.{" "}
            <Link
              href="/cookies"
              className="font-semibold text-brand underline underline-offset-2"
            >
              Más información
            </Link>
            .
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => decidir("necessary")}
            className="h-10 w-full whitespace-nowrap px-4 text-sm sm:w-auto"
          >
            Solo necesarias
          </Button>
          <Button
            onClick={() => decidir("all")}
            className="h-10 w-full whitespace-nowrap px-4 text-sm sm:w-auto"
          >
            Aceptar todas
          </Button>
        </div>
      </div>
    </div>
  );
}
