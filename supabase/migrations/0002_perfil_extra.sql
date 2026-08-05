-- Campos opcionales de perfil para personalizar las recomendaciones de la IA desde el primer mensaje.
-- Ejecutar en Supabase Dashboard > SQL Editor.

alter table public.profiles
  add column if not exists ubicacion text,
  add column if not exists fecha_nacimiento date;
