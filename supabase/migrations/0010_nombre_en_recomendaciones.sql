-- ---------------------------------------------------------------------------
-- Nombre del sitio en inglés
--
-- Los catálogos de los proveedores de entradas (Tiqets, Klook...) están en inglés
-- ("Seville Cathedral"), y la IA escribe en español ("Catedral de Sevilla"). Sin un
-- nombre en inglés no hay forma de cruzar una recomendación con la ficha del producto,
-- así que el botón de reservar se quedaba en el buscador del proveedor.
--
-- Se rellena desde el prompt (campo "nombre_en" del array 'mapa'). Es nullable: las
-- recomendaciones ya guardadas se quedan sin él y siguen funcionando igual.
-- ---------------------------------------------------------------------------

alter table public.recomendaciones
  add column if not exists nombre_en text;
