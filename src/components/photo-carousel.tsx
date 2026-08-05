"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function PhotoCarousel({ fotos, alt, className }: { fotos: string[]; alt: string; className?: string }) {
  const [activo, setActivo] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (fotos.length === 0) return null;

  function onScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActivo(index);
  }

  function ir(delta: number) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: delta * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div className={cn("group relative", className)}>
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {fotos.map((foto, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={foto}
            src={foto}
            alt={`${alt} ${i + 1}`}
            className="h-full w-full shrink-0 snap-center object-cover"
            loading="lazy"
          />
        ))}
      </div>

      {fotos.length > 1 && (
        <>
          {activo > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                ir(-1);
              }}
              aria-label="Foto anterior"
              className="absolute left-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronLeft size={14} />
            </button>
          )}
          {activo < fotos.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                ir(1);
              }}
              aria-label="Foto siguiente"
              className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronRight size={14} />
            </button>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-1.5 flex justify-center gap-1">
            {fotos.map((foto, i) => (
              <span
                key={foto}
                className={cn(
                  "h-1.5 w-1.5 rounded-full bg-white/70 shadow",
                  i === activo && "bg-white"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
