-- Hasta ahora la propina elegida en "Pedir la cuenta" solo se guardaba en
-- table_requests (para el aviso al mesero) y nunca quedaba ligada al pedido
-- en sí — imposible de reportar en el cierre de caja de forma confiable
-- (una mesa puede tener varias solicitudes de cuenta por día, sin relación
-- directa a qué pedido correspondía cada una). Se guarda también en el
-- pedido, que es la fuente confiable para reportes.
alter table public.orders
  add column propina numeric(10,2) not null default 0;
