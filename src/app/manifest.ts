import type { MetadataRoute } from "next";

/**
 * Manifest de aplicación instalable.
 *
 * `start_url` apunta a /mis-viajes y no a la portada: quien se instala la app ya
 * está convencido, y abrirle una página de marketing cada vez sería absurdo. Si
 * no tiene sesión, el proxy lo manda al login, que es el comportamiento correcto.
 *
 * El icono se sirve desde /logo.png (public/) y no desde el `icon.png` de la
 * convención de metadatos, porque a ese Next le pone un hash en la URL y aquí
 * hace falta una ruta estable. Son el mismo archivo.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Traveler IA — Viaja más, gastando menos",
    short_name: "Traveler IA",
    description:
      "Cuéntale tu plan a la IA y te devuelve un itinerario con sitios concretos, marcados en el mapa, y los trucos para que salga por bastante menos.",
    lang: "es-ES",
    start_url: "/mis-viajes",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f97316",
    categories: ["travel", "lifestyle"],
    icons: [
      {
        src: "/logo.png",
        sizes: "2048x2048",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
