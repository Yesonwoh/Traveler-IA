-- Impedir que el mismo vuelo se guarde dos veces en un viaje.
--
-- La 0009 ya deduplicaba las reservas, pero su índice es PARCIAL: solo cubre las que
-- vienen de una recomendación de la IA (`where recomendacion_id is not null`). Los
-- vuelos no tienen recomendación detrás —nacen de una tarifa del buscador, ver
-- src/actions/reservas.ts `guardarVuelo`—, así que caían fuera y pulsar "Continuar"
-- dos veces dejaba la misma tarifa repetida en la pestaña Vuelos.
--
-- La clave es (viaje_id, nombre, fecha): el nombre lleva aerolínea, número de vuelo y
-- ruta, y la fecha distingue el mismo vuelo en dos días distintos, que sí son dos
-- opciones diferentes y deben poder guardarse las dos.
--
-- Las filas con `fecha` nula quedan fuera del índice (en SQL, null nunca es igual a
-- null). Es el caso raro de una tarifa sin fecha utilizable; de esas se encarga la
-- comprobación previa del servidor, que sí trata el nulo como nulo.
--
-- Aplicar en Supabase Dashboard > SQL Editor.

-- 1. Limpiar los duplicados que ya hubiera --------------------------------------

delete from public.reservas r
where r.tipo = 'vuelo'
  and r.fecha is not null
  and r.ctid <> (
    select min(r2.ctid)
    from public.reservas r2
    where r2.viaje_id = r.viaje_id
      and r2.tipo = 'vuelo'
      and r2.nombre = r.nombre
      and r2.fecha = r.fecha
  );

-- 2. Impedir que vuelvan a crearse -----------------------------------------------

create unique index if not exists reservas_vuelo_uniq
  on public.reservas (viaje_id, nombre, fecha)
  where tipo = 'vuelo' and fecha is not null;
