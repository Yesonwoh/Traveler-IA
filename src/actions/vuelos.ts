"use server";

import { createClient } from "@/lib/supabase/server";
import { buscarVuelos, type ResultadoVuelos } from "@/lib/travelpayouts/vuelos";
import { resolverRuta } from "@/lib/travelpayouts/lugares";

export type BusquedaVuelos = {
  viajeId: string;
  origen: string;
  destino: string;
  fechaIda: string;
  fechaVuelta: string;
  soloDirectos: boolean;
  viajeros: number;
};

export type ResultadoBusqueda = ResultadoVuelos & { origenIata?: string; destinoIata?: string };

export async function buscarVuelosViaje(params: BusquedaVuelos): Promise<ResultadoBusqueda> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { estado: "error", vuelos: [], mensaje: "Sesión no válida." };

  const origen = params.origen.trim();
  const destino = params.destino.trim();
  if (!origen || !destino) {
    return { estado: "error", vuelos: [], mensaje: "Dinos desde dónde sales y a dónde vas." };
  }

  const { desde, hasta } = await resolverRuta(origen, destino);
  if (!desde || !hasta) {
    const falla = !desde ? origen : destino;
    return {
      estado: "error",
      vuelos: [],
      mensaje: `No encontramos aeropuerto para "${falla}". Prueba con el nombre de la ciudad.`,
    };
  }

  // guardamos la ruta resuelta en el viaje para no repetir el autocompletado.
  // Acotado también por user_id: RLS ya lo impide, pero así el filtro no depende
  // de que ninguna política siga siendo la que es hoy.
  await supabase
    .from("viajes")
    .update({ origen_iata: desde.iata, destino_iata: hasta.iata })
    .eq("id", params.viajeId)
    .eq("user_id", user.id);

  const resultado = await buscarVuelos({
    origenIata: desde.iata,
    destinoIata: hasta.iata,
    fechaIda: params.fechaIda || null,
    fechaVuelta: params.fechaVuelta || null,
    soloDirectos: params.soloDirectos,
    viajeros: params.viajeros,
  });

  return { ...resultado, origenIata: desde.iata, destinoIata: hasta.iata };
}
