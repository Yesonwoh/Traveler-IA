"use client";

import { Carousel } from "@/components/carousel";
import { RecommendationCard } from "@/components/recommendation-card";
import type { RecomendacionDTO } from "@/lib/chat/tipos";

export function RecommendationCarousel({
  recomendaciones,
  viajeId,
}: {
  recomendaciones: RecomendacionDTO[];
  viajeId: string;
}) {
  return (
    <Carousel className="mt-3">
      {recomendaciones.map((r) => (
        <RecommendationCard key={r.id} recomendacion={r} viajeId={viajeId} />
      ))}
    </Carousel>
  );
}
