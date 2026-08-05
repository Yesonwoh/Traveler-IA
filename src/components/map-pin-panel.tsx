"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { PinDetailCard } from "@/components/pin-detail-card";
import { cn } from "@/lib/utils";
import type { RecomendacionDTO } from "@/actions/chat";

export function MapPinPanel({
  recomendacion,
  viajeId,
  onClose,
}: {
  recomendacion: RecomendacionDTO;
  viajeId: string;
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
        <PinDetailCard
          recomendacion={recomendacion}
          viajeId={viajeId}
          className="shadow-2xl"
          photoClassName="h-52"
        />
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
