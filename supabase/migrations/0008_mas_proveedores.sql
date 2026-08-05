-- Programas de afiliación añadidos: KKday y WeGoTrip (tours y actividades),
-- Kiwitaxi (traslados de aeropuerto) y Go City (pases de ciudad).
-- Ver src/lib/affiliates/links.ts.
-- Ejecutar en Supabase Dashboard > SQL Editor.

alter table public.reservas drop constraint if exists reservas_proveedor_check;

alter table public.reservas add constraint reservas_proveedor_check
  check (
    proveedor is null
    or proveedor in (
      'aviasales', 'hotellook', 'tiqets', 'getyourguide', 'klook',
      'kkday', 'wegotrip', 'gocity', 'kiwitaxi',
      'kiwi', 'travelpayouts', 'otro'
    )
  );
