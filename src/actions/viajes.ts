"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { topeDeViajes } from "@/lib/limites";
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

async function sumarConversacion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("conversaciones_creadas")
    .eq("id", userId)
    .single();

  await supabase
    .from("profiles")
    .update({ conversaciones_creadas: (profile?.conversaciones_creadas ?? 0) + 1 })
    .eq("id", userId);
}

/**
 * Primer turno del chat: la propuesta, el título de verdad y la foto de portada.
 * Si la IA falla no se propaga el error a propósito — el viaje ya existe con el
 * mensaje del usuario dentro y la conversación se puede seguir a mano.
 */
async function montarPrimeraPropuesta(
  supabase: Awaited<ReturnType<typeof createClient>>,
  viajeId: string,
  userId: string,
  texto: string,
  ciudadDeReserva: string
) {
  try {
    const respuesta = await procesarMensajeIA({
      viajeId,
      userId,
      texto,
      instrucciones: BRIEFING_SYSTEM_PROMPT,
      // el título y la portada los resolvemos aquí, con el mensaje completo delante
      portadaAutomatica: false,
    });

    const titulo = await generarTituloViaje(texto, respuesta.texto);

    if (titulo?.titulo) {
      await supabase
        .from("viajes")
        .update({ nombre_del_viaje: titulo.titulo })
        .eq("id", viajeId);
    }

    await ponerFotoPortada(viajeId, respuesta.texto, titulo?.ciudad || ciudadDeReserva);
  } catch {
    // ver comentario de la cabecera
  }
}

const IdeaSchema = z
  .string()
  .trim()
  .min(3, "Cuéntanos un poco más.")
  .max(600);

/**
 * Crea un viaje a partir de la frase suelta que alguien escribe en la portada.
 *
 * Es el mismo destino que `crearViajeGuiado` por otro camino: allí el usuario
 * rellena un formulario, aquí escribe como le hablaría a un colega. No hay datos
 * estructurados que guardar (origen, fechas, presupuesto), así que el buscador
 * de vuelos de ese viaje arranca vacío hasta que salgan en la conversación.
 */
export async function crearViajeDesdeIdea(texto: string): Promise<ViajeState> {
  const parsed = IdeaSchema.safeParse(texto);
  if (!parsed.success) {
    return { error: "Cuéntanos algo más de tu viaje para poder montarlo." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const tope = await topeDeViajes(supabase, user.id);
  if (!tope.ok) return { error: tope.error };

  const idea = parsed.data;
  const viaje = await insertarViaje(supabase, user.id, "Viaje nuevo", BriefingSchema.parse({}));
  if (!viaje) return { error: "No se pudo crear el viaje." };

  await sumarConversacion(supabase, user.id);
  await montarPrimeraPropuesta(supabase, viaje.id, user.id, idea, "");

  revalidatePath("/mis-viajes");
  redirect(`/viaje/${viaje.id}/chat`);
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

  // Antes que nada: crear un viaje dispara propuesta de la IA, título y foto de
  // portada. Es la operación más cara de la app y era la única sin freno.
  const tope = await topeDeViajes(supabase, user.id);
  if (!tope.ok) return { error: tope.error };

  const nombreProvisional = parsed.data.destino || "Viaje sorpresa";

  const viaje = await insertarViaje(supabase, user.id, nombreProvisional, parsed.data);
  if (!viaje) return { error: "No se pudo crear el viaje." };

  await sumarConversacion(supabase, user.id);
  await montarPrimeraPropuesta(supabase, viaje.id, user.id, briefing, parsed.data.destino);

  revalidatePath("/mis-viajes");
  redirect(`/viaje/${viaje.id}/chat`);
}

export async function toggleFavoritoViaje(viajeId: string, esFavorito: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  // El `user_id` es redundante mientras RLS esté bien puesto, y esa es justo la razón
  // de ponerlo: si algún día una política cambia, esto sigue acotado por sí solo.
  await supabase
    .from("viajes")
    .update({ es_favorito: !esFavorito })
    .eq("id", viajeId)
    .eq("user_id", user.id);
  revalidatePath("/mis-viajes");
}

export async function eliminarViaje(viajeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  await supabase.from("viajes").delete().eq("id", viajeId).eq("user_id", user.id);
  revalidatePath("/mis-viajes");
}
