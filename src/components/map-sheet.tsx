"use client";

import { type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function MapSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className={cn("fixed inset-0 z-50", !open && "pointer-events-none")}>
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out",
          open ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex h-[88vh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="relative flex shrink-0 items-center justify-center border-b border-stone-100 py-3">
          <div className="h-1.5 w-10 rounded-full bg-stone-300" />
          <button
            onClick={onClose}
            aria-label="Cerrar mapa"
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-stone-500 hover:bg-stone-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
