-- La dueña pidió que la opción de billetera digital cubra Yape y Plin
-- juntos. De ahora en adelante la app guarda 'Yape/Plin' en vez de 'plin'.
-- Se deja 'plin' como valor válido en el constraint (no se reescriben los
-- pedidos históricos): cambiar esos registros retroactivamente falsearía el
-- reporte de cierre de caja de días en los que Yape ni siquiera era opción.
alter table public.orders drop constraint orders_metodo_pago_check;
alter table public.orders add constraint orders_metodo_pago_check
  check (metodo_pago in ('efectivo', 'plin', 'tarjeta', 'Yape/Plin'));
