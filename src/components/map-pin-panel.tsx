"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * El cajón que sube desde abajo del mapa con el detalle del punto tocado. Es solo el
 * envoltorio (posición, entrada animada y botón de cerrar): la tarjeta de dentro la pone
 * quien lo usa, porque el mapa del chat y el de favoritos enseñan cosas distintas —
 * el de favoritos tiene sitios guardados a mano, sin recomendación detrás.
 */
export function MapPinPanel({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={cn(
        "absolute inset-x-3 bottom-3 z-10 transition-all duration-300 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      )}
    >
      <div className="relative">
        {children}
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute left-2 top-2 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
