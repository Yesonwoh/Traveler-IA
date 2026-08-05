import {
  Bed,
  Landmark,
  TreePine,
  Castle,
  UtensilsCrossed,
  Bus,
  Plane,
  Waves,
  Church,
  Star,
  type LucideIcon,
} from "lucide-react";

/** Elige un icono reconocible según el tipo de recomendación y palabras clave del nombre/opinión. */
export function resolveIcono(punto: { tipo?: string; nombre: string; opinion?: string | null }): LucideIcon {
  if (punto.tipo === "favorito") return Star;
  if (punto.tipo === "vuelo") return Plane;
  if (punto.tipo === "transporte") return Bus;
  if (punto.tipo === "restaurante") return UtensilsCrossed;
  if (punto.tipo === "alojamiento") return Bed;

  const texto = `${punto.nombre} ${punto.opinion ?? ""}`.toLowerCase();
  if (/castillo|castle|alcázar|alcazar|fortaleza|palacio/.test(texto)) return Castle;
  if (/parque|park|jardín|jardin|garden|bosque/.test(texto)) return TreePine;
  if (/playa|beach|costa/.test(texto)) return Waves;
  if (/iglesia|catedral|basílica|basilica|church|cathedral|templo/.test(texto)) return Church;

  return Landmark;
}
