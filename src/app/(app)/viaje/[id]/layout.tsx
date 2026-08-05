import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TripTabs } from "./trip-tabs";

export default async function ViajeLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: viaje } = await supabase
    .from("viajes")
    .select("id, nombre_del_viaje, foto_portada_url")
    .eq("id", id)
    .single();

  if (!viaje) notFound();

  /**
   * El viaje es una pantalla de trabajo, no un documento: ocupa exactamente el alto que
   * queda bajo la cabecera de la app (h-14) y no hace scroll de página. Antes la portada
   * de 160px más las pestañas empujaban el chat (que medía 80vh) por debajo del pliegue y
   * el campo de escribir quedaba fuera de pantalla en cualquier portátil; encima la rueda
   * del ratón la capturaba el scroll interno del chat, así que no había forma de bajar.
   * Los márgenes negativos cancelan el padding del <main> de (app)/layout para ir a sangre.
   */
  return (
    <div className="-mx-4 -my-8 flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden sm:-mx-6 lg:-mx-8">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-stone-200 bg-white px-3 sm:px-6">
        <Link
          href="/mis-viajes"
          aria-label="Volver a mis viajes"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
        >
          <ArrowLeft size={18} />
        </Link>

        {/* la portada sobrevive como miniatura: da identidad al viaje sin comerse 160px */}
        <div
          aria-hidden
          className="h-10 w-10 shrink-0 rounded-xl border border-stone-200 bg-brand bg-cover bg-center"
          style={
            viaje.foto_portada_url
              ? { backgroundImage: `url(${viaje.foto_portada_url})` }
              : undefined
          }
        />

        <h1 className="min-w-0 truncate text-base font-bold text-stone-900 sm:text-lg">
          {viaje.nombre_del_viaje}
        </h1>
      </div>

      <div className="shrink-0 bg-white">
        <TripTabs viajeId={viaje.id} />
      </div>

      {/* min-h-0 es lo que deja al hijo medir su alto real dentro del contenedor flex */}
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
