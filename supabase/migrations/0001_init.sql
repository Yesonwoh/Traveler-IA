-- Traveler IA - esquema inicial
-- Ejecutar en Supabase Dashboard > SQL Editor (o `supabase db push` si usas la CLI enlazada al proyecto)

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles: extiende auth.users 1:1
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  telefono text,
  foto_perfil_url text,
  contador_mensajes int not null default 0,
  conversaciones_creadas int not null default 0,
  cookies_aceptadas boolean not null default false,
  stripe_customer_id text,
  subscription_status text not null default 'free' check (subscription_status in ('free', 'premium')),
  subscription_current_period_end timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);

-- crea automáticamente el profile al registrarse un usuario
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nombre)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- viajes
-- ---------------------------------------------------------------------------
create table public.viajes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre_del_viaje text not null,
  foto_portada_url text,
  es_favorito boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.viajes enable row level security;

create policy "viajes: all own" on public.viajes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- mensajes
-- ---------------------------------------------------------------------------
create table public.mensajes (
  id uuid primary key default gen_random_uuid(),
  viaje_id uuid not null references public.viajes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  texto text not null,
  es_ia boolean not null,
  created_at timestamptz not null default now()
);

alter table public.mensajes enable row level security;

create policy "mensajes: all own" on public.mensajes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index mensajes_viaje_id_idx on public.mensajes (viaje_id, created_at);

-- ---------------------------------------------------------------------------
-- recomendaciones (items del array "mapa" de la respuesta de la IA)
-- ---------------------------------------------------------------------------
create table public.recomendaciones (
  id uuid primary key default gen_random_uuid(),
  mensaje_id uuid not null references public.mensajes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('vuelo', 'alojamiento', 'actividad', 'transporte', 'monumento', 'restaurante', 'otro')),
  nombre text not null,
  direccion text,
  opinion text,
  lat double precision,
  lng double precision,
  country_code text,
  created_at timestamptz not null default now()
);

alter table public.recomendaciones enable row level security;

create policy "recomendaciones: all own" on public.recomendaciones
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index recomendaciones_mensaje_id_idx on public.recomendaciones (mensaje_id);

-- ---------------------------------------------------------------------------
-- favoritos
-- ---------------------------------------------------------------------------
create table public.favoritos (
  id uuid primary key default gen_random_uuid(),
  viaje_id uuid not null references public.viajes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  recomendacion_id uuid references public.recomendaciones(id) on delete set null,
  nombre text not null,
  direccion text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

alter table public.favoritos enable row level security;

create policy "favoritos: all own" on public.favoritos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index favoritos_viaje_id_idx on public.favoritos (viaje_id);

-- ---------------------------------------------------------------------------
-- reservas
-- ---------------------------------------------------------------------------
create table public.reservas (
  id uuid primary key default gen_random_uuid(),
  viaje_id uuid not null references public.viajes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  recomendacion_id uuid references public.recomendaciones(id) on delete set null,
  tipo text not null check (tipo in ('vuelo', 'alojamiento', 'actividad', 'transporte', 'otro')),
  nombre text not null,
  proveedor text check (proveedor in ('kiwi', 'klook', 'tiqets', 'travelpayouts', 'otro')),
  url_afiliado text,
  estado text not null default 'guardado' check (estado in ('guardado', 'reservado')),
  precio_estimado numeric,
  fecha timestamptz,
  notas text,
  created_at timestamptz not null default now()
);

alter table public.reservas enable row level security;

create policy "reservas: all own" on public.reservas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index reservas_viaje_id_idx on public.reservas (viaje_id);
create index reservas_tipo_idx on public.reservas (viaje_id, tipo);

-- ---------------------------------------------------------------------------
-- example_prompts (lectura publica, sin RLS de usuario)
-- ---------------------------------------------------------------------------
create table public.example_prompts (
  id uuid primary key default gen_random_uuid(),
  category text,
  prompt_text text not null,
  expanded_description text
);

alter table public.example_prompts enable row level security;

create policy "example_prompts: public read" on public.example_prompts
  for select using (true);

-- ---------------------------------------------------------------------------
-- storage: avatars (foto de perfil) y portadas (foto de viaje)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('portadas', 'portadas', true)
on conflict (id) do nothing;

create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars: owner write"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatars: owner update"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatars: owner delete"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "portadas: public read"
  on storage.objects for select
  using (bucket_id = 'portadas');

create policy "portadas: owner write"
  on storage.objects for insert
  with check (bucket_id = 'portadas' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "portadas: owner update"
  on storage.objects for update
  using (bucket_id = 'portadas' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "portadas: owner delete"
  on storage.objects for delete
  using (bucket_id = 'portadas' and auth.uid()::text = (storage.foldername(name))[1]);
