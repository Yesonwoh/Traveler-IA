-- ---------------------------------------------------------------------------
-- Evitar que el mismo sitio se guarde dos veces
--
-- Problema: `agregarFavorito` y `guardarReserva` hacían un insert plano y no había
-- ninguna restricción de unicidad. El botón solo recordaba que ya lo habías pulsado
-- en el estado de React, así que bastaba con recargar la página para poder volver a
-- guardar el mismo sitio, y acababa repetido en Favoritos y en Reservas.
--
-- Esta migración borra los duplicados que ya existen (conservando el más antiguo de
-- cada grupo) y luego crea los índices únicos que impiden que vuelva a pasar.
--
-- El índice es PARCIAL: `recomendacion_id` es nullable y los guardados manuales (sin
-- recomendación de la IA detrás) deben poder repetirse; solo se deduplica lo que viene
-- de una recomendación concreta.
-- ---------------------------------------------------------------------------

-- 1. Limpiar duplicados existentes -----------------------------------------------

delete from public.favoritos f
where f.recomendacion_id is not null
  and f.ctid <> (
    select min(f2.ctid)
    from public.favoritos f2
    where f2.viaje_id = f.viaje_id
      and f2.recomendacion_id = f.recomendacion_id
  );

delete from public.reservas r
where r.recomendacion_id is not null
  and r.ctid <> (
    select min(r2.ctid)
    from public.reservas r2
    where r2.viaje_id = r.viaje_id
      and r2.recomendacion_id = r.recomendacion_id
  );

-- 2. Impedir que vuelvan a crearse -------------------------------------------------

create unique index if not exists favoritos_viaje_recomendacion_uniq
  on public.favoritos (viaje_id, recomendacion_id)
  where recomendacion_id is not null;

create unique index if not exists reservas_viaje_recomendacion_uniq
  on public.reservas (viaje_id, recomendacion_id)
  where recomendacion_id is not null;
