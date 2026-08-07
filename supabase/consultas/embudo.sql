-- Embudo de captación de Traveler IA.
--
-- Pégalas en Supabase Dashboard > SQL Editor. Son de solo lectura: no cambian
-- nada. Las visitas NO están aquí (esas van en Vercel Analytics, que no sabe
-- quién es cada persona); esto empieza en el registro y llega hasta el pago.
--
-- Cómo se usa: Vercel Analytics te da VISITAS, la consulta 1 te da REGISTROS.
-- Dividir uno entre otro es el número que decide si el problema es el tráfico
-- (pocas visitas) o la portada (muchas visitas y pocos registros).


-- ---------------------------------------------------------------------------
-- 0. QUIÉN HA HECHO QUÉ: una fila por usuario, de más nuevo a más viejo
-- ---------------------------------------------------------------------------
-- Es la consulta del día a día mientras haya pocos usuarios: de un vistazo ves
-- quién entró, si llegó a crear algo y si volvió. Cuando la lista no quepa en
-- una pantalla, deja de servir y pasa a mandar la número 2.
--
-- Cómo leerla: "mensajes" a 0 significa que se registró y no llegó a hablar con
-- la IA. "mensajes" a 1 significa que probó una vez y no siguió, que hoy es el
-- punto donde se pierde la gente.
select
  p.created_at::date                        as se_registro,
  coalesce(nullif(p.nombre, ''), '—')       as usuario,
  p.subscription_status                     as plan,
  (select count(*) from public.viajes v
     where v.user_id = p.id)                as viajes,
  (select count(*) from public.mensajes m
     where m.user_id = p.id and not m.es_ia) as mensajes,
  (select count(*) from public.favoritos f
     where f.user_id = p.id)                as favoritos,
  (select count(*) from public.reservas r
     where r.user_id = p.id)                as reservas,
  (select max(m.created_at)::date from public.mensajes m
     where m.user_id = p.id and not m.es_ia) as ultimo_dia_activo
from public.profiles p
order by p.created_at desc;


-- ---------------------------------------------------------------------------
-- 1. EL NÚMERO DE LA SEMANA: registros por día, últimos 30 días
-- ---------------------------------------------------------------------------
select
  date_trunc('day', created_at)::date as dia,
  count(*)                            as registros
from public.profiles
where created_at > now() - interval '30 days'
group by 1
order by 1 desc;


-- ---------------------------------------------------------------------------
-- 2. EL EMBUDO COMPLETO: dónde se cae la gente
-- ---------------------------------------------------------------------------
-- Lee la columna "porcentaje" de arriba abajo. El primer salto grande es tu
-- problema real, y solo ese. Umbrales de referencia:
--   registro -> crea viaje    por debajo de 40% = el primer paso no se entiende
--   crea viaje -> habla       por debajo de 70% = el chat no invita a escribir
--   habla -> vuelve otro día  por debajo de 20% = el producto no engancha
with base as (
  select
    p.id,
    p.created_at,
    p.subscription_status,
    (select count(*) from public.viajes v  where v.user_id = p.id)                as viajes,
    (select count(*) from public.mensajes m where m.user_id = p.id and not m.es_ia) as mensajes_suyos,
    (select count(distinct date_trunc('day', m.created_at))
       from public.mensajes m where m.user_id = p.id and not m.es_ia)             as dias_activos
  from public.profiles p
  where p.created_at > now() - interval '30 days'
),
pasos as (
  select 1 as orden, 'Se registró'              as paso, count(*) as usuarios from base
  union all
  select 2, 'Creó al menos un viaje',           count(*) from base where viajes > 0
  union all
  select 3, 'Escribió al menos un mensaje',     count(*) from base where mensajes_suyos > 0
  union all
  select 4, 'Volvió otro día distinto',         count(*) from base where dias_activos > 1
  union all
  select 5, 'Es premium',                       count(*) from base where subscription_status = 'premium'
)
select
  paso,
  usuarios,
  round(100.0 * usuarios / nullif(max(usuarios) over (), 0), 1) as porcentaje_del_total,
  round(100.0 * usuarios / nullif(lag(usuarios) over (order by orden), 0), 1) as porcentaje_del_paso_anterior
from pasos
order by orden;


-- ---------------------------------------------------------------------------
-- 3. ¿SE QUEDAN? Registros de esta semana que siguen vivos
-- ---------------------------------------------------------------------------
select
  date_trunc('week', p.created_at)::date as semana_de_registro,
  count(*)                                                          as registros,
  count(*) filter (where m.ultimo > p.created_at + interval '1 day') as siguieron_al_dia_siguiente,
  count(*) filter (where m.ultimo > now() - interval '7 days')       as activos_ultimos_7_dias
from public.profiles p
left join lateral (
  select max(created_at) as ultimo
  from public.mensajes
  where user_id = p.id and not es_ia
) m on true
where p.created_at > now() - interval '90 days'
group by 1
order by 1 desc;


-- ---------------------------------------------------------------------------
-- 4. QUÉ PIDEN: los primeros mensajes de los usuarios nuevos
-- ---------------------------------------------------------------------------
-- No es una métrica, es material para los vídeos. Lo que la gente escribe de
-- verdad son los ganchos que funcionan, con sus palabras y no con las tuyas.
select
  p.created_at::date as se_registro,
  left(m.texto, 160) as primer_mensaje
from public.profiles p
join lateral (
  select texto, created_at
  from public.mensajes
  where user_id = p.id and not es_ia
  order by created_at
  limit 1
) m on true
where p.created_at > now() - interval '30 days'
order by p.created_at desc
limit 50;


-- ---------------------------------------------------------------------------
-- 5. LO QUE TE CUESTA: volumen de mensajes a la IA (proxy del gasto de API)
-- ---------------------------------------------------------------------------
select
  date_trunc('day', created_at)::date as dia,
  count(*) filter (where not es_ia)   as mensajes_de_usuarios,
  count(distinct user_id)             as usuarios_activos,
  round(count(*) filter (where not es_ia)::numeric
        / nullif(count(distinct user_id), 0), 1) as mensajes_por_usuario
from public.mensajes
where created_at > now() - interval '30 days'
group by 1
order by 1 desc;
