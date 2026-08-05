/**
 * Catálogo de preferencias de viaje del perfil. Lo comparten el formulario de
 * configuración, el diálogo de creación de viaje y el contexto que recibe la IA,
 * para que las etiquetas que ve el usuario sean exactamente las que lee el modelo.
 */

export const INTERESES = [
  "Fiesta y vida nocturna",
  "Cultura y museos",
  "Gastronomía",
  "Naturaleza y senderismo",
  "Playa y relax",
  "Aventura y deportes",
  "Compras y mercadillos",
  "Fotografía y miradores",
] as const;

export const PRESUPUESTO_ESTILOS = [
  { value: "mochilero", label: "Mochilero extremo (lo más barato posible)" },
  { value: "ajustado", label: "Ajustado, pero sin sufrir" },
  { value: "equilibrado", label: "Equilibrado (ahorro donde no se nota)" },
  { value: "comodo", label: "Cómodo (pago por comodidad si compensa)" },
] as const;

export const TIPOS_ALOJAMIENTO = [
  { value: "hostel", label: "Hostel / habitación compartida" },
  { value: "privada_barata", label: "Habitación privada barata" },
  { value: "apartamento", label: "Apartamento entero" },
  { value: "hotel", label: "Hotel" },
  { value: "indiferente", label: "Me da igual, lo que salga mejor" },
] as const;

export const RITMOS_VIAJE = [
  { value: "tranquilo", label: "Tranquilo (pocas cosas al día)" },
  { value: "equilibrado", label: "Equilibrado" },
  { value: "intenso", label: "Intenso (exprimir cada hora)" },
] as const;

export type PreferenciasPerfil = {
  ubicacion?: string | null;
  fechaNacimiento?: string | null;
  intereses?: string[] | null;
  presupuestoEstilo?: string | null;
  tipoAlojamiento?: string | null;
  ritmoViaje?: string | null;
  notasViaje?: string | null;
};

function etiqueta(
  opciones: readonly { value: string; label: string }[],
  value: string | null | undefined
): string | null {
  return opciones.find((o) => o.value === value)?.label ?? null;
}

function calcularEdad(fechaNacimiento: string): number {
  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const aunNoCumple =
    hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());
  if (aunNoCumple) edad--;
  return edad;
}

/**
 * Convierte las preferencias guardadas en configuración en un bloque de contexto
 * para la IA. Devuelve null si el usuario no ha rellenado nada.
 */
export function construirContextoUsuario(p: PreferenciasPerfil): string | null {
  const partes: string[] = [];

  if (p.ubicacion) partes.push(`vive en ${p.ubicacion} (asume que sale desde ahí salvo que diga otra cosa)`);
  if (p.fechaNacimiento) partes.push(`tiene ${calcularEdad(p.fechaNacimiento)} años`);

  const intereses = (p.intereses ?? []).filter(Boolean);
  if (intereses.length > 0) partes.push(`le interesa: ${intereses.join(", ")}`);

  const presupuesto = etiqueta(PRESUPUESTO_ESTILOS, p.presupuestoEstilo);
  if (presupuesto) partes.push(`estilo de gasto: ${presupuesto}`);

  const alojamiento = etiqueta(TIPOS_ALOJAMIENTO, p.tipoAlojamiento);
  if (alojamiento) partes.push(`alojamiento preferido: ${alojamiento}`);

  const ritmo = etiqueta(RITMOS_VIAJE, p.ritmoViaje);
  if (ritmo) partes.push(`ritmo de viaje: ${ritmo}`);

  if (p.notasViaje) partes.push(`a tener en cuenta: ${p.notasViaje}`);

  if (partes.length === 0) return null;

  return [
    "PERFIL DEL VIAJERO (lo ha configurado él mismo en la app).",
    `Datos: ${partes.join("; ")}.`,
    "Úsalos para afinar tus propuestas: filtra alojamientos, actividades y ritmo según esto.",
    "No los recites ni los menciones como 'datos' o 'preferencias'; simplemente acierta.",
    "Si el usuario pide algo que contradice su perfil, gana siempre lo que pide en el chat.",
  ].join(" ");
}
