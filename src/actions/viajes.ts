"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { procesarMensajeIA, ponerFotoPortada } from "@/lib/chat/responder";
import { generarTituloViaje } from "@/lib/ai/travelerAI";
import { BRIEFING_SYSTEM_PROMPT } from "@/lib/ai/prompts";

export type ViajeState = { error: string | null };

const BriefingSchema = z.object({
  destino: z.string().trim().max(120).default(""),
  fechasTipo: z.enum(["exactas", "flexible"]).default("flexible"),
  fechaIda: z.string().trim().max(20).default(""),
  fechaVuelta: z.string().trim().max(20).default(""),
  duracion: z.string().trim().max(20).default(""),
  cuando: z.string().trim().max(60).default(""),
  origen: z.string().trim().max(120).default(""),
  viajeros: z.string().trim().max(10).default(""),
  presupuesto: z.string().trim().max(20).default(""),
  intereses: z.array(z.string().max(60)).max(20).default([]),
  notas: z.string().trim().max(600).default(""),
});

export type BriefingViaje = z.input<typeof BriefingSchema>;

function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso;
  return fecha.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

/** Convierte el formulario inicial en el primer mensaje del chat, en lenguaje natural. */
function construirBriefing(d: z.output<typeof BriefingSchema>): string {
  const lineas: string[] = ["Quiero organizar un viaje. Estos son mis datos:"];

  lineas.push(
    d.destino
      ? `• Destino: ${d.destino}`
      : "• Destino: todavía no lo tengo claro, sorpréndeme con un chollo."
  );

  if (d.fechasTipo === "exactas" && (d.fechaIda || d.fechaVuelta)) {
    const ida = d.fechaIda ? formatearFecha(d.fechaIda) : "sin definir";
    const vuelta = d.fechaVuelta ? formatearFecha(d.fechaVuelta) : "sin definir";
    lineas.push(`• Fechas exactas: del ${ida} al ${vuelta}`);
  } else {
    const partes = [
      d.duracion ? `${d.duracion} días` : null,
      d.cuando ? `preferiblemente ${d.cuando}` : null,
    ].filter(Boolean);
    lineas.push(
      `• Fechas flexibles${partes.length > 0 ? `: ${partes.join(", ")}` : ""}. Elige tú la ventana más barata.`
    );
  }

  if (d.origen) lineas.push(`• Salgo desde: ${d.origen}`);
  if (d.viajeros) lineas.push(`• Somos ${d.viajeros} persona(s)`);
  if (d.presupuesto) lineas.push(`• Presupuesto: ${d.presupuesto}€ por persona (todo incluido)`);
  if (d.intereses.length > 0) lineas.push(`• Me interesa: ${d.intereses.join(", ")}`);
  if (d.notas) lineas.push(`• Además: ${d.notas}`);

  lineas.push("Móntame una primera propuesta con esto.");

  return lineas.join("\n");
}

/**
 * Columnas del viaje que alimentan el buscador de vuelos. El briefing en texto sigue
 * yendo al chat; esto es lo mismo pero consultable.
 */
function datosEstructurados(d: z.output<typeof BriefingSchema>) {
  const viajeros = Number.parseInt(d.viajeros, 10);
  const presupuesto = Number.parseFloat(d.presupuesto);
  const exactas = d.fechasTipo === "exactas";

  return {
    origen: d.origen || null,
    destino: d.destino || null,
    fecha_ida: exactas && d.fechaIda ? d.fechaIda : null,
    fecha_vuelta: exactas && d.fechaVuelta ? d.fechaVuelta : null,
    viajeros: Number.isFinite(viajeros) ? viajeros : null,
    presupuesto: Number.isFinite(presupuesto) ? presupuesto : null,
  };
}

/**
 * Crea el viaje con sus datos estructurados y, si esa base de datos aún no tiene
 * aplicada la migración 0006, reintenta con lo mínimo para no bloquear la creación.
 */
async function insertarViaje(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  nombre: string,
  datos: z.output<typeof BriefingSchema>
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("viajes")
    .insert({ user_id: userId, nombre_del_viaje: nombre, ...datosEstructurados(datos) })
    .select("id")
    .single();

  if (!error && data) return data;

  const { data: basico } = await supabase
    .from("viajes")
    .insert({ user_id: userId, nombre_del_viaje: nombre })
    .select("id")
    .single();

  return basico ?? null;
}

export async function crearViajeGuiado(datos: BriefingViaje): Promise<ViajeState> {
  const parsed = BriefingSchema.safeParse(datos);
  if (!parsed.success) return { error: "Revisa los datos del formulario." };

  const briefing = construirBriefing(parsed.data);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const nombreProvisional = parsed.data.destino || "Viaje sorpresa";

  const viaje = await insertarViaje(supabase, user.id, nombreProvisional, parsed.data);
  if (!viaje) return { error: "No se pudo crear el viaje." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("conversaciones_creadas")
    .eq("id", user.id)
    .single();

  await supabase
    .from("profiles")
    .update({ conversaciones_creadas: (profile?.conversaciones_creadas ?? 0) + 1 })
    .eq("id", user.id);

  try {
    const respuesta = await procesarMensajeIA({
      viajeId: viaje.id,
      userId: user.id,
      texto: briefing,
      instrucciones: BRIEFING_SYSTEM_PROMPT,
      // el título y la portada los resolvemos aquí, con el briefing completo delante
      portadaAutomatica: false,
    });

    const titulo = await generarTituloViaje(briefing, respuesta.texto);

    if (titulo?.titulo) {
      await supabase
        .from("viajes")
        .update({ nombre_del_viaje: titulo.titulo })
        .eq("id", viaje.id);
    }

    await ponerFotoPortada(viaje.id, respuesta.texto, titulo?.ciudad || parsed.data.destino);
  } catch {
    // Si la IA falla, el viaje ya existe con el briefing del usuario dentro:
    // puede seguir la conversación a mano desde el chat.
  }

  revalidatePath("/mis-viajes");
  redirect(`/viaje/${viaje.id}/chat`);
}

export async function toggleFavoritoViaje(viajeId: string, esFavorito: boolean) {
  const supabase = await createClient();
  await supabase.from("viajes").update({ es_favorito: !esFavorito }).eq("id", viajeId);
  revalidatePath("/mis-viajes");
}

export async function eliminarViaje(viajeId: string) {
  const supabase = await createClient();
  await supabase.from("viajes").delete().eq("id", viajeId);
  revalidatePath("/mis-viajes");
}
