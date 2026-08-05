-- Nuevos proveedores de afiliación (Travelpayouts): Aviasales para vuelos, Hotellook
-- para alojamiento y programas de terceros para actividades. Se mantienen los valores
-- antiguos ('kiwi', 'travelpayouts') para no invalidar las reservas ya guardadas.
-- Ver src/lib/affiliates/links.ts.
-- Ejecutar en Supabase Dashboard > SQL Editor.

alter table public.reservas drop constraint if exists reservas_proveedor_check;

alter table public.reservas add constraint reservas_proveedor_check
  check (
    proveedor is null
    or proveedor in (
      'aviasales', 'hotellook', 'tiqets', 'getyourguide', 'klook',
      'kiwi', 'travelpayouts', 'otro'
    )
  );
