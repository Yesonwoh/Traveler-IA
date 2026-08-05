-- Varias fotos por recomendación (antes solo una).
-- Ejecutar en Supabase Dashboard > SQL Editor.

alter table public.recomendaciones
  add column if not exists fotos_urls text[];

alter table public.recomendaciones
  drop column if exists foto_url;
