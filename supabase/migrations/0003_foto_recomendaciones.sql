-- Foto del lugar para las tarjetas de recomendación.
-- Ejecutar en Supabase Dashboard > SQL Editor.

alter table public.recomendaciones
  add column if not exists foto_url text;
