"use client";

import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { borrarConsentimiento } from "@/lib/cookie-consent";

export function CookieResetButton() {
  const [hecho, setHecho] = useState(false);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        onClick={() => {
          borrarConsentimiento();
          setHecho(true);
        }}
        className="h-10 px-4 text-sm"
      >
        {hecho ? <Check size={15} /> : <RotateCcw size={15} />}
        {hecho ? "Preferencias restablecidas" : "Cambiar mis preferencias"}
      </Button>
      {hecho && (
        <span className="text-sm text-stone-500">
          Vuelve a elegir en el aviso de la parte inferior.
        </span>
      )}
    </div>
  );
}
