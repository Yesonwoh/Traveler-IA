"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { procesarMensajeIA } from "@/lib/chat/responder";
import type { MensajeDTO } from "@/lib/chat/tipos";

export type { MensajeDTO, RecomendacionDTO } from "@/lib/chat/tipos";

export async function enviarMensaje(viajeId: string, texto: string): Promise<MensajeDTO> {
  const textoLimpio = texto.trim();
  if (!textoLimpio) throw new Error("Escribe algo primero.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { count } = await supabase
    .from("mensajes")
    .select("id", { count: "exact", head: true })
    .eq("viaje_id", viajeId);
  const esPrimerMensaje = (count ?? 0) === 0;

  const respuesta = await procesarMensajeIA({
    viajeId,
    userId: user.id,
    texto: textoLimpio,
  });

  revalidatePath(`/viaje/${viajeId}/chat`);
  if (esPrimerMensaje) revalidatePath("/mis-viajes");

  return respuesta;
}
