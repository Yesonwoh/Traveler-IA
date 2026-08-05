import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Pone en mayúscula la inicial de cada palabra de un topónimo escrito a mano.
 * El perfil guarda lo que el usuario teclea ("granada", "san sebastián") y luego eso
 * aparece tal cual en formularios y en el contexto de la IA.
 */
export function capitalizar(texto: string): string {
  return texto
    .trim()
    .toLocaleLowerCase("es-ES")
    .replace(/(^|[\s\-/])(\p{L})/gu, (_, separador: string, letra: string) =>
      separador + letra.toLocaleUpperCase("es-ES")
    );
}
