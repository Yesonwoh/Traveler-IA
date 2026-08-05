-- Preferencias de viaje del perfil: la IA las recibe como contexto en cada mensaje
-- (ver src/lib/preferencias.ts y src/lib/chat/responder.ts).
-- Ejecutar en Supabase Dashboard > SQL Editor.

alter table public.profiles
  add column if not exists intereses text[] not null default '{}',
  add column if not exists presupuesto_estilo text,
  add column if not exists tipo_alojamiento text,
  add column if not exists ritmo_viaje text,
  add column if not exists notas_viaje text;
