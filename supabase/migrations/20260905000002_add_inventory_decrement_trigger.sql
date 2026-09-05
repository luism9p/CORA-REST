-- Descuento automático de inventario al confirmarse un pedido (insert en
-- order_items), no al marcar como entregado — así funciona sin que nadie
-- tenga que supervisar ni hacer clic en nada.
--
-- Un trigger en la tabla, no lógica dentro de submit_table_order(): hoy
-- solo hay un camino de inserción a order_items, pero ya existe precedente
-- en este proyecto (dispatch_order_items) de anticipar que en el futuro
-- otra pantalla podría insertar ahí directo. Un trigger cubre cualquier
-- camino futuro sin que nadie tenga que acordarse de llamarlo.
--
-- security definer es necesario porque order_items_public_insert permite
-- insertar como `anon` (el cliente en su celular, sin sesión) — y `anon`
-- no tiene ningún grant sobre menu_item_inventory/inventory_movements.
-- Mismo motivo por el que dispatch_order_items también es security
-- definer.
create or replace function public.decrement_menu_item_inventory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_qty numeric;
begin
  update public.menu_item_inventory mi
  set cantidad_actual = mi.cantidad_actual - new.cantidad,
      updated_at = now()
  from public.menu_items m
  where mi.menu_item_id = new.menu_item_id
    and m.id = mi.menu_item_id
    and m.inventariable = true
  returning mi.cantidad_actual into v_new_qty;

  -- Si no hubo fila que actualizar (producto sin inventario activado, o
  -- inventariable = false), no pasa nada más: ese es justo el opt-in.
  if found then
    insert into public.inventory_movements (menu_item_id, tipo, delta, cantidad_resultante, order_item_id)
    values (new.menu_item_id, 'venta', -new.cantidad, v_new_qty, new.id);
  end if;

  return new;
end;
$$;

-- Hueco conocido, no resuelto a propósito: no hay trigger de DELETE que
-- devuelva stock si algún día se borra un order_item. Hoy nada en la app
-- borra order_items, así que es un gap latente, no activo — hay que
-- recordarlo si en el futuro se agrega una función de cancelar/anular
-- pedido.
create trigger trg_order_items_decrement_inventory
after insert on public.order_items
for each row execute function public.decrement_menu_item_inventory();

-- Este proyecto de Supabase tiene un default ACL a nivel de schema que le
-- da EXECUTE a `anon` y `authenticated` sobre toda función nueva que se
-- cree en `public` (confirmado vía pg_default_acl) — no es algo que las
-- migraciones anteriores hayan configurado a propósito, es el default de
-- la plataforma. `revoke ... from public` NO alcanza para quitarlo, porque
-- el grant es directo a esos roles, no heredado de PUBLIC. En la práctica
-- Postgres ya bloquea llamar una función de trigger fuera de un trigger
-- ("trigger functions can only be called as triggers"), así que esto no
-- era explotable — se revoca igual para que quede como defensa en
-- profundidad real y no dependa solo de esa protección estructural.
revoke execute on function public.decrement_menu_item_inventory() from anon, authenticated;
