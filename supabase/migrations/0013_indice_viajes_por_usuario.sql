-- Índice para el tope de creación de viajes (ver src/lib/limites.ts).
--
-- Crear un viaje es la operación más cara de la app: propuesta de la IA, título
-- generado y foto de portada, más una geocodificación y una foto por cada sitio.
-- Hasta ahora era la única sin freno; el freno cuenta los viajes del usuario en las
-- últimas 24 h, y sin este índice esa cuenta es un escaneo en cada creación.
--
-- Es el gemelo de `mensajes_user_created_idx`, que creó la migración 0012.
--
-- Aplicar en Supabase Dashboard > SQL Editor.

create index if not exists viajes_user_created_idx
  on public.viajes (user_id, created_at desc);
