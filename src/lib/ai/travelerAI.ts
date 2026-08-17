import OpenAI from "openai";
import { z } from "zod";
import {
  FREE_MODEL,
  FREE_SYSTEM_PROMPT,
  FREE_TEMPERATURE,
  PREMIUM_MODEL,
  PREMIUM_SYSTEM_PROMPT,
  PREMIUM_TEMPERATURE,
  EXTRACT_CITY_MODEL,
  EXTRACT_CITY_SYSTEM_PROMPT,
  TITULO_MODEL,
  TITULO_SYSTEM_PROMPT,
  trucosPrompt,
} from "./prompts";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const TIPO_RECOMENDACION = [
  "vuelo",
  "alojamiento",
  "actividad",
  "transporte",
  "monumento",
  "restaurante",
  "otro",
] as const;

const RecomendacionSchema = z.object({
  nombre: z.string(),
  // opcional a propósito: si el modelo se lo salta, la recomendación sigue siendo
  // válida y simplemente no podremos cruzarla con el catálogo de entradas
  nombre_en: z.string().optional().default(""),
  tipo: z.enum(TIPO_RECOMENDACION).catch("otro"),
  direccion: z.string().optional().default(""),
  opinion: z.string().optional().default(""),
});

const RespuestaIASchema = z.object({
  chat: z.string(),
  mapa: z.array(RecomendacionSchema).default([]),
});

export type RespuestaIA = z.infer<typeof RespuestaIASchema>;
export type HistorialMensaje = { role: "user" | "assistant"; content: string };

export async function generarRespuestaIA(params: {
  tier: "free" | "premium";
  historial: HistorialMensaje[];
  mensaje: string;
  /** Contexto opcional del viajero (perfil y preferencias) para personalizar sin tocar el prompt base. */
  contextoUsuario?: string | null;
  /** Instrucciones extra solo para este turno (p. ej. el briefing de creación del viaje). */
  instrucciones?: string | null;
  /** Nota comercial de este turno (p. ej. que tiene la prueba gratuita sin estrenar). */
  promocion?: string | null;
  /**
   * Modelo y temperatura solo para este turno. El prompt base sigue siendo el del plan,
   * que es lo que mantiene la voz: esto cambia con qué se responde, no quién responde.
   * Hoy lo usa la primera impresión (ver PRIMERA_IMPRESION en ./prompts).
   */
  modelo?: string;
  temperatura?: number;
}): Promise<RespuestaIA> {
  const isPremium = params.tier === "premium";
  const model = params.modelo ?? (isPremium ? PREMIUM_MODEL : FREE_MODEL);
  const systemPrompt = isPremium ? PREMIUM_SYSTEM_PROMPT : FREE_SYSTEM_PROMPT;
  const temperature =
    params.temperatura ?? (isPremium ? PREMIUM_TEMPERATURE : FREE_TEMPERATURE);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
  ];
  // Los trucos van justo detrás del prompt base y nunca dentro: el base es largo y
  // no cambia jamás, así que la caché de prefijo de OpenAI lo reutiliza. Si la
  // muestra rotatoria viviera dentro, cada turno rompería esa caché entera.
  messages.push({ role: "system", content: trucosPrompt() });
  if (params.contextoUsuario) {
    messages.push({ role: "system", content: params.contextoUsuario });
  }
  if (params.promocion) {
    messages.push({ role: "system", content: params.promocion });
  }
  if (params.instrucciones) {
    messages.push({ role: "system", content: params.instrucciones });
  }
  messages.push(...params.historial, { role: "user", content: params.mensaje });

  const completion = await openai.chat.completions.create({
    model,
    temperature,
    response_format: { type: "json_object" },
    messages,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("La IA no devolvió respuesta.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("La IA devolvió un JSON inválido.");
  }

  const result = RespuestaIASchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("La respuesta de la IA no cumple el formato esperado.");
  }

  return result.data;
}

const TituloViajeSchema = z.object({
  titulo: z.string().min(1).max(60),
  ciudad: z.string().default("travel"),
});

export type TituloViaje = z.infer<typeof TituloViajeSchema>;

/**
 * Nombra el viaje a partir del briefing del usuario y la primera respuesta de la IA,
 * y devuelve además el destino en inglés para buscar la foto de portada.
 */
export async function generarTituloViaje(
  briefing: string,
  respuestaIA: string
): Promise<TituloViaje | null> {
  try {
    const completion = await openai.chat.completions.create({
      model: TITULO_MODEL,
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: TITULO_SYSTEM_PROMPT },
        { role: "user", content: `BRIEFING:\n${briefing}\n\nRESPUESTA:\n${respuestaIA}` },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;

    const result = TituloViajeSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    // el nombre bonito es un extra: si falla, el viaje se queda con el provisional
    return null;
  }
}

/** Extrae el destino principal de una respuesta de la IA (para buscar foto de portada del viaje). */
export async function extraerCiudad(textoIA: string): Promise<string | null> {
  const completion = await openai.chat.completions.create({
    model: EXTRACT_CITY_MODEL,
    messages: [
      { role: "system", content: EXTRACT_CITY_SYSTEM_PROMPT },
      { role: "user", content: textoIA },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() || null;
}
