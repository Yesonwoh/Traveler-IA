/**
 * La idea de viaje que alguien escribe en la portada antes de tener cuenta.
 *
 * Vive en `sessionStorage`, no en la URL ni en una cookie, por tres motivos:
 * sobrevive al registro y a la vuelta de Google (misma pestaña, mismo origen),
 * no deja el texto del usuario en el historial ni en los logs del servidor, y
 * no necesita consentimiento porque es el dato que la persona acaba de escribir
 * para recibir exactamente el servicio que ha pedido.
 *
 * Se borra en cuanto se usa: si el viaje se crea, ya vive en la base de datos.
 */
export const IDEA_PENDIENTE_KEY = "traveler-ia-idea";

/** El mismo tope que valida el servidor, para no dejar escribir de más. */
export const IDEA_MAX_CARACTERES = 600;

export function guardarIdeaPendiente(texto: string) {
  try {
    sessionStorage.setItem(IDEA_PENDIENTE_KEY, texto.slice(0, IDEA_MAX_CARACTERES));
  } catch {
    // Modo privado o almacenamiento bloqueado: se pierde la idea, no la sesión.
    // El usuario acaba en /registro igualmente y puede crear el viaje a mano.
  }
}

export function leerIdeaPendiente(): string | null {
  try {
    const texto = sessionStorage.getItem(IDEA_PENDIENTE_KEY)?.trim();
    return texto ? texto : null;
  } catch {
    return null;
  }
}

export function borrarIdeaPendiente() {
  try {
    sessionStorage.removeItem(IDEA_PENDIENTE_KEY);
  } catch {
    // ignorar
  }
}
