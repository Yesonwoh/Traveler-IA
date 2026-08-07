"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function agregarFavorito(params: {
  viajeId: string;
  recomendacionId?: string | null;
  nombre: string;
  direccion?: string | null;
  lat?: number | null;
  lng?: number | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  // Con recomendación detrás, guardar dos veces no debe crear dos filas. Se comprueba
  // antes de insertar en vez de usar upsert/onConflict a propósito: así funciona igual
  // aunque la migración 0009 (índice único) todavía no esté aplicada. Cuando lo esté,
  // el índice es la garantía dura y esta comprobación solo evita el viaje de ida.
  if (params.recomendacionId) {
    const { data: existente } = await supabase
      .from("favoritos")
      .select("id")
      .eq("viaje_id", params.viajeId)
      .eq("recomendacion_id", params.recomendacionId)
      .maybeSingle();

    if (existente) {
      revalidatePath(`/viaje/${params.viajeId}/favoritos`);
      return;
    }
  }

  const { error } = await supabase.from("favoritos").insert({
    viaje_id: params.viajeId,
    user_id: user.id,
    recomendacion_id: params.recomendacionId ?? null,
    nombre: params.nombre,
    direccion: params.direccion ?? null,
    lat: params.lat ?? null,
    lng: params.lng ?? null,
  });

  // 23505 = lo insertó otra pestaña entre la comprobación y el insert: ya está guardado
  if (error && error.code !== "23505") throw new Error("No se pudo guardar en favoritos.");

  revalidatePath(`/viaje/${params.viajeId}/favoritos`);
}

export async function eliminarFavorito(id: string, viajeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  // El `user_id` es redundante mientras RLS esté bien puesto, y esa es justo la razón
  // de ponerlo: si algún día una política cambia, esto sigue acotado por sí solo.
  await supabase.from("favoritos").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath(`/viaje/${viajeId}/favoritos`);
}
