-- El check-in por GPS (Edge Function check-in) ya prueba que alguien está
-- físicamente en el restaurante y le da un session_token con vencimiento.
-- Hasta ahora submit_table_order() no lo pedía para nada: cualquiera que
-- llamara al RPC directo (curl, devtools) con un table_id válido podía
-- crear pedidos sin haber pasado nunca por esa validación de ubicación —
-- exactamente el hueco que esto cierra.

-- 1) Columna de auditoría: qué sesión autorizó la creación de este pedido.
--    Anulable porque los pedidos de antes de este cambio no tienen token, y
--    porque en una adición a un pedido ya activo (ver submit_table_order)
--    se conserva el token de quien lo creó, no el de cada celular que suma
--    platos después — la validación de presencia sí se exige en cada
--    llamada, pero la columna solo registra el origen del pedido.
alter table public.orders add column if not exists session_token uuid null;

-- 2) submit_table_order ahora exige un session_token vigente para la mesa
--    antes de tocar cualquier otra cosa. Agregar un parámetro cambia la
--    firma de la función (aunque tenga default): CREATE OR REPLACE con una
--    firma distinta crea un OVERLOAD nuevo, no reemplaza el de 4
--    argumentos — y ese seguiría siendo llamable por anon sin token
--    alguno, dejando el hueco de seguridad abierto. Por eso el DROP
--    explícito antes de recrearla.
drop function if exists public.submit_table_order(integer, text, numeric, jsonb);

create function public.submit_table_order(
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
  if not exists (
    select 1 from public.table_sessions
    where session_token = p_session_token
      and table_id = p_table_id
      and expires_at > now()
  ) then
    raise exception 'Sesión inválida o expirada. Por favor recarga la página.';
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
      -- Otro celular ganó la carrera contra el índice único de orders y
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
    -- No se toca metodo_pago ni session_token del pedido existente: es "la
    -- cuenta de la mesa", ya abierta por quien pidió primero. La validación
    -- de arriba ya confirmó que quien suma este pedido también tiene una
    -- sesión vigente para la misma mesa — solo no se reescribe el registro
    -- de quién abrió la cuenta.
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
