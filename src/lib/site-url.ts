// URL pública del sitio. La leen metadataBase, el sitemap, el robots.txt y el
// redirectTo de Supabase, así que un valor sucio rompe las cuatro cosas a la vez.
//
// El saneo no es paranoia: NEXT_PUBLIC_SITE_URL se cargó una vez con un BOM
// (U+FEFF) delante —PowerShell escribe UTF-8 con BOM por defecto— y el build
// entero se cayó con "Invalid URL" señalando a una URL que parecía correcta.
// Como el valor se incrusta al compilar, el fallo solo aparece al desplegar.
const RESERVA = "https://traveleria.app";

function limpiar(valor: string | undefined): string | undefined {
  if (!valor) return undefined;
  // BOM, espacios, comillas de un copiar-pegar y barras finales.
  const limpio = valor
    .replace(/^﻿/, "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\/+$/, "");
  if (!limpio) return undefined;
  try {
    new URL(limpio);
    return limpio;
  } catch {
    return undefined;
  }
}

// Undefined cuando no hay variable o su valor no es una URL válida. Quien
// necesite distinguir "configurada" de "por defecto" —el redirectTo de Supabase,
// que en local debe caer a localhost y no a producción— usa esta.
export const SITE_URL_CONFIGURADA = limpiar(process.env.NEXT_PUBLIC_SITE_URL);

// Siempre una URL válida. Para metadatos, sitemap y robots, donde no existe un
// "sin valor" razonable.
export const SITE_URL = SITE_URL_CONFIGURADA ?? RESERVA;
