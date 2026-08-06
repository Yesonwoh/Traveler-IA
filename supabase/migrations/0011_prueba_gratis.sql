-- Prueba gratuita de 3 días de Premium.
--
-- Stripe es la fuente de verdad de si alguien ya gastó su prueba (se puede
-- consultar la lista de suscripciones del cliente), pero esa consulta cuesta una
-- llamada de red. El chat necesita saberlo en CADA mensaje para decidir si la IA
-- puede nombrar la prueba, así que se guarda también aquí.
alter table public.profiles
  add column if not exists subscription_trial_end timestamptz,
  add column if not exists trial_used boolean not null default false;

comment on column public.profiles.subscription_trial_end is
  'Fin de la prueba gratuita EN CURSO. Null si la suscripción ya se está cobrando o no existe.';
comment on column public.profiles.trial_used is
  'true en cuanto el usuario ha consumido su prueba gratuita. Nunca vuelve a false.';
