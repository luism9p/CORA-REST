-- Despachos parciales: reemplaza el booleano order_items.listo (solo
-- preparando/listo) por un estado de 3 valores, para que en mesas con
-- pedidos grandes el cliente vea el progreso de cada plato por separado,
-- incluyendo cuándo ya lo llevó el mesero (no solo cuándo salió de cocina).
alter table public.order_items
  add column estado text not null default 'preparando'
    check (estado in ('preparando', 'listo_para_servir', 'en_mesa'));

update public.order_items
set estado = case when listo then 'listo_para_servir' else 'preparando' end;

alter table public.order_items drop column listo;
