/**
 * Busca una foto en Unsplash para usar de portada de un viaje.
 *
 * Pide varios resultados y elige uno al azar en vez de quedarse siempre con el primero:
 * con `per_page=1` dos viajes al mismo destino salían con la foto idéntica en la rejilla
 * de "Mis viajes" y parecían el mismo viaje duplicado.
 */
export async function buscarFotoUnsplash(query: string): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey || !query?.trim()) return null;

  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "12");
  url.searchParams.set("orientation", "landscape");

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Client-ID ${accessKey}` },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const resultados: { urls?: { regular?: string } }[] = data?.results ?? [];
    if (resultados.length === 0) return null;

    const elegida = resultados[Math.floor(Math.random() * resultados.length)];
    return elegida?.urls?.regular ?? resultados[0]?.urls?.regular ?? null;
  } catch {
    return null;
  }
}
