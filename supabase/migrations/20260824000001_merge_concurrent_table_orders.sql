-- Varios clientes pueden escanear el mismo tag NFC de una mesa y enviar
-- pedidos desde celulares distintos, casi al mismo tiempo. Sin esto, cada
-- "Confirmar pedido" crea una fila nueva en orders, y el resto del sistema
-- ya asume que existe como mucho un pedido activo por mesa (por ejemplo
-- activeOrderFor() en AdminDashboardPage.vue filtra por
-- `estado <> 'entregado'` y usa Array.find, que solo se queda con el
-- primero) — un segundo pedido activo para la misma mesa quedaría huérfano:
-- invisible para cocina y fuera del total cobrado.

-- 1) Invariante a nivel de base de datos: como mucho un pedido no entregado
--    por mesa. Esto es lo que de verdad cierra la carrera entre dos INSERT
--    simultáneos que ambos ven "esta mesa no tiene pedido activo todavía"
--    — el segundo choca contra este índice en vez de crear un duplicado.
--    'listo' cuenta como activo a propósito, no solo 'nuevo'/'preparando':
--    un pedido ya listo pero aún no entregado sigue siendo "la cuenta de la
--    mesa" para efectos de sumar un pedido nuevo.
create unique index if not exists orders_one_active_per_table
  on public.orders (table_id)
  where estado <> 'entregado';

-- 2) La comprobación + inserción/actualización tiene que ocurrir en una
--    sola transacción atómica, no en dos round-trips separados desde el
--    cliente (select y luego insert/update) — si no, dos celulares pueden
--    leer "no hay pedido activo" antes de que ninguno de los dos haya
--    insertado nada, y crear el duplicado de todos modos.
--    security definer además es necesario para que el UPDATE de `total`
--    funcione: orders_authenticated_update solo permite UPDATE a
--    `authenticated` (el mesero logueado), no a `anon` (el cliente en su
--    celular, que nunca inicia sesión).
create or replace function public.submit_table_order(
  p_table_id integer,
  p_metodo_pago text,
  p_delta_total numeric,
  p_items jsonb
)
returns table (order_id uuid, was_addition boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_was_addition boolean;
  v_item jsonb;
  v_item_id uuid;
  v_mod jsonb;
begin
  select id into v_order_id
  from public.orders
  where table_id = p_table_id and estado <> 'entregado'
  for update
  limit 1;

  if v_order_id is null then
    begin
      insert into public.orders (table_id, total, metodo_pago)
      values (p_table_id, p_delta_total, p_metodo_pago)
      returning id into v_order_id;
      v_was_addition := false;
    exception when unique_violation then
      -- Otro celular ganó la carrera contra el índice único de arriba y
      -- creó el pedido activo de esta mesa justo entre nuestro SELECT y
      -- este INSERT. Nos enganchamos a esa fila (ya committeada, así que
      -- visible y bloqueable) en vez de fallar: es exactamente el caso que
      -- esta función existe para resolver.
      select id into v_order_id
      from public.orders
      where table_id = p_table_id and estado <> 'entregado'
      for update
      limit 1;

      update public.orders
      set total = total + p_delta_total
      where id = v_order_id;
      v_was_addition := true;
    end;
  else
    -- No se toca metodo_pago del pedido existente: es "la cuenta de la
    -- mesa", ya elegida por quien pidió primero; el cobro se resuelve una
    -- sola vez al final con "Pedir la cuenta", no por cada adición.
    update public.orders
    set total = total + p_delta_total
    where id = v_order_id;
    v_was_addition := true;
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.order_items (order_id, menu_item_id, cantidad, nota)
    values (
      v_order_id,
      (v_item->>'menu_item_id')::uuid,
      (v_item->>'cantidad')::int,
      nullif(v_item->>'nota', '')
    )
    returning id into v_item_id;

    for v_mod in select * from jsonb_array_elements(coalesce(v_item->'modifiers', '[]'::jsonb))
    loop
      insert into public.order_item_modifiers (order_item_id, nombre, precio_extra)
      values (v_item_id, v_mod->>'nombre', (v_mod->>'precio_extra')::numeric);
    end loop;
  end loop;

  return query select v_order_id, v_was_addition;
end;
$$;

grant execute on function public.submit_table_order(integer, text, numeric, jsonb) to anon, authenticated;
