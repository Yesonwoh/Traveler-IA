export const COOKIE_CONSENT_KEY = "traveler-ia-cookies";
export const COOKIE_CONSENT_EVENT = "traveler-ia-cookies-change";

export type CookieConsent = "all" | "necessary";

/** Lee la decisión guardada. Devuelve null si el usuario todavía no ha elegido. */
export function leerConsentimiento(): CookieConsent | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_CONSENT_KEY}=([^;]*)`)
  );
  const valor = match?.[1];
  return valor === "all" || valor === "necessary" ? valor : null;
}

export function guardarConsentimiento(valor: CookieConsent) {
  const unAno = 60 * 60 * 24 * 365;
  const seguro = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_CONSENT_KEY}=${valor}; path=/; max-age=${unAno}; SameSite=Lax${seguro}`;
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
}

/** Borra la decisión para que vuelva a aparecer el aviso. */
export function borrarConsentimiento() {
  document.cookie = `${COOKIE_CONSENT_KEY}=; path=/; max-age=0`;
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
}
