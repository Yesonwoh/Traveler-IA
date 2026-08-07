-- Impedir que un usuario se regale Premium a sí mismo.
--
-- EL AGUJERO: la política "profiles: update own" permite actualizar la fila propia,
-- pero RLS no distingue columnas. La clave anónima y la URL de Supabase son públicas
-- por diseño (van en el bundle del navegador), así que cualquiera con sesión podía
-- llamar directamente a la API REST:
--
--   PATCH /rest/v1/profiles?id=eq.<su-id>   { "subscription_status": "premium" }
--
-- y quedarse premium sin pasar por Stripe. Lo mismo con trial_used (prueba gratuita
-- infinita) y con stripe_customer_id (apuntar el checkout al cliente de otra persona).
--
-- LA SOLUCIÓN: RLS decide QUÉ FILAS, y los privilegios de columna deciden QUÉ CAMPOS.
-- Se quita el UPDATE en bloque y se concede solo sobre lo que el usuario puede tocar
-- de verdad. Las columnas de dinero quedan reservadas al service_role, que es quien
-- usa el webhook de Stripe (ver src/app/api/webhooks/stripe/route.ts).
--
-- Aplicar en Supabase Dashboard > SQL Editor.

revoke update on public.profiles from authenticated;

grant update (
  -- perfil que el usuario edita en Configuración
  nombre,
  telefono,
  foto_perfil_url,
  ubicacion,
  fecha_nacimiento,
  intereses,
  presupuesto_estilo,
  tipo_alojamiento,
  ritmo_viaje,
  notas_viaje,
  -- consentimiento de cookies
  cookies_aceptadas,
  -- contadores de uso: inflarlos no da acceso a nada, solo ensucia estadísticas
  contador_mensajes,
  conversaciones_creadas
) on public.profiles to authenticated;

-- Columnas deliberadamente FUERA de ese grant, solo escribibles por service_role:
--   subscription_status, subscription_current_period_end, subscription_trial_end,
--   trial_used, stripe_customer_id
--
-- Si más adelante se añade una columna nueva a profiles, hay que decidir a cuál de
-- los dos grupos pertenece: por defecto quedará protegida, que es el lado seguro.

comment on column public.profiles.subscription_status is
  'premium o free. Solo lo escribe el webhook de Stripe con service_role: authenticated no tiene UPDATE sobre esta columna (ver 0012).';
comment on column public.profiles.stripe_customer_id is
  'Id de cliente en Stripe. Solo lo escribe el servidor con service_role (ver 0012): si el usuario pudiera cambiarlo, apuntaría su checkout al cliente de otra persona.';

-- ---------------------------------------------------------------------------
-- Índice para el límite de mensajes por hora (ver src/actions/chat.ts).
-- Sin esto, la comprobación del límite hace un escaneo por usuario en cada mensaje.
-- ---------------------------------------------------------------------------
create index if not exists mensajes_user_created_idx
  on public.mensajes (user_id, created_at desc);
