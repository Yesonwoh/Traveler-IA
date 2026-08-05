-- Datos estructurados del viaje (los rellena el formulario de creación guiada).
-- Hasta ahora solo existían como texto dentro del primer mensaje del chat, así que
-- no se podían usar para buscar vuelos. Ver src/actions/viajes.ts.
-- Ejecutar en Supabase Dashboard > SQL Editor.

alter table public.viajes
  add column if not exists origen text,
  add column if not exists destino text,
  add column if not exists origen_iata text,
  add column if not exists destino_iata text,
  add column if not exists fecha_ida date,
  add column if not exists fecha_vuelta date,
  add column if not exists viajeros int,
  add column if not exists presupuesto numeric;
