-- La vista de mesero (/mesero) deja tomar un pedido a mano para un cliente
-- que no escaneó el NFC (walk-in, alguien que prefiere no usar el
-- celular). submit_table_order() exige un session_token vigente desde la
-- migración anterior — correcto para un cliente anónimo, pero un mesero ya
-- autenticado en el panel es una prueba de presencia más fuerte que el GPS
-- de un celular, así que no tiene sentido bloquearlo por no traer un
-- session_token que nunca existió para ese pedido.
--
-- auth.role() lee el claim `role` del JWT de quien hace la llamada (no del
-- dueño de la función, que sigue siendo security definer para todo lo
-- demás) — 'authenticated' para alguien logueado en /admin o /mesero,
-- 'anon' para el cliente en su celular. Es la forma estándar de Supabase
-- de distinguir esto dentro de una función.
create or replace function public.submit_table_order(
  p_table_id integer,
  p_metodo_pago text,
  p_delta_total numeric,
  p_items jsonb,
  p_session_token uuid default null
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
  if auth.role() <> 'authenticated' then
    if not exists (
      select 1 from public.table_sessions
      where session_token = p_session_token
        and table_id = p_table_id
        and expires_at > now()
    ) then
      raise exception 'Sesión inválida o expirada. Por favor recarga la página.';
    end if;
  end if;

  select id into v_order_id
  from public.orders
  where table_id = p_table_id and estado <> 'entregado'
  for update
  limit 1;

  if v_order_id is null then
    begin
      insert into public.orders (table_id, total, metodo_pago, session_token)
      values (p_table_id, p_delta_total, p_metodo_pago, p_session_token)
      returning id into v_order_id;
      v_was_addition := false;
    exception when unique_violation then
      -- Otro celular (o el mesero) ganó la carrera contra el índice único
      -- de orders y creó el pedido activo de esta mesa justo entre nuestro
      -- SELECT y este INSERT. Nos enganchamos a esa fila (ya committeada,
      -- así que visible y bloqueable) en vez de fallar.
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
    -- No se toca metodo_pago ni session_token del pedido existente: es "la
    -- cuenta de la mesa", ya abierta por quien pidió primero — sea un
    -- cliente por NFC o un mesero a mano.
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

grant execute on function public.submit_table_order(integer, text, numeric, jsonb, uuid) to anon, authenticated;
