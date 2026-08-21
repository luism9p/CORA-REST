-- CORA ya no acepta Yape (solo Efectivo, Plin y Tarjeta). Se quita del
-- check constraint de orders.metodo_pago para que quede consistente con
-- el resto del sitio (ver QrModal.astro en la carta principal).
alter table public.orders drop constraint orders_metodo_pago_check;
alter table public.orders add constraint orders_metodo_pago_check
  check (metodo_pago in ('efectivo', 'plin', 'tarjeta'));
