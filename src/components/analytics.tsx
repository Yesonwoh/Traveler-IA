"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { COOKIE_CONSENT_EVENT, leerConsentimiento } from "@/lib/cookie-consent";

/**
 * Vercel Analytics, pero solo si el usuario ha aceptado todas las cookies.
 *
 * Vercel Analytics no usa cookies ni guarda datos personales, así que legalmente
 * podría ir siempre. Se respeta igualmente el "Solo necesarias" porque es lo que
 * el aviso le promete al usuario ("y, si nos dejas, otras para entender cómo se
 * usa"). Si algún día se quiere medir al 100%, hay que cambiar antes esa frase,
 * no este componente.
 */
export function AnalyticsConConsentimiento() {
  const [permitido, setPermitido] = useState(false);

  useEffect(() => {
    function sincronizar() {
      setPermitido(leerConsentimiento() === "all");
    }
    sincronizar();
    // El banner avisa por evento en cuanto se decide, sin recargar la página.
    window.addEventListener(COOKIE_CONSENT_EVENT, sincronizar);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, sincronizar);
  }, []);

  if (!permitido) return null;

  return <Analytics />;
}
