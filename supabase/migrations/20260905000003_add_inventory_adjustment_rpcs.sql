-- Dos funciones angostas para las únicas dos acciones manuales sobre
-- inventario: activarlo en un producto (con stock inicial) y ajustarlo
-- (reabastecer o registrar un conteo físico). Ambas security definer,
-- concedidas solo a `authenticated` — nunca a `anon` — mismo patrón que
-- dispatch_order_items: una función de un solo propósito en vez de abrir
-- INSERT/UPDATE genérico sobre las tablas de inventario.

create or replace function public.enable_menu_item_inventory(
  p_menu_item_id uuid,
  p_cantidad_inicial numeric default 0
)
returns public.menu_item_inventory
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.menu_item_inventory;
begin
  if auth.role() <> 'authenticated' then
    raise exception 'No autorizado.';
  end if;

  update public.menu_items set inventariable = true where id = p_menu_item_id;

  insert into public.menu_item_inventory (menu_item_id, cantidad_actual)
  values (p_menu_item_id, p_cantidad_inicial)
  on conflict (menu_item_id) do nothing
  returning * into v_row;

  if v_row.id is not null then
    insert into public.inventory_movements (menu_item_id, tipo, delta, cantidad_resultante, nota, created_by)
    values (p_menu_item_id, 'restock', p_cantidad_inicial, p_cantidad_inicial, 'Activación de inventario', auth.uid());
  else
    -- Ya existía la fila (se había desactivado y se vuelve a activar): no
    -- se resetea el contador ni el historial, se conserva tal cual estaba.
    select * into v_row from public.menu_item_inventory where menu_item_id = p_menu_item_id;
  end if;

  return v_row;
end;
$$;

grant execute on function public.enable_menu_item_inventory(uuid, numeric) to authenticated;
-- Este proyecto de Supabase concede EXECUTE a `anon` sobre toda función
-- nueva en `public` por un default ACL de la plataforma (confirmado vía
-- pg_default_acl), no por nada que este proyecto haya configurado — así
-- que sin este revoke explícito, anon SÍ podía llamar esta función a pesar
-- del "grant ... to authenticated" de arriba. El chequeo interno
-- auth.role() ya la protegía en la práctica, pero esto la protege también
-- a nivel de permisos de Postgres, sin depender solo de la lógica interna.
revoke execute on function public.enable_menu_item_inventory(uuid, numeric) from anon;

create or replace function public.adjust_menu_item_inventory(
  p_menu_item_id uuid,
  p_tipo text,
  p_cantidad numeric,
  p_nota text default null
)
returns public.inventory_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current numeric;
  v_delta numeric;
  v_new_qty numeric;
  v_row public.inventory_movements;
begin
  if auth.role() <> 'authenticated' then
    raise exception 'No autorizado.';
  end if;
  if p_tipo not in ('restock', 'ajuste_conteo') then
    raise exception 'Tipo de movimiento inválido: %', p_tipo;
  end if;

  select cantidad_actual into v_current
  from public.menu_item_inventory where menu_item_id = p_menu_item_id
  for update;

  if not found then
    raise exception 'Este producto no tiene inventario habilitado.';
  end if;

  -- 'restock': p_cantidad es un delta ("cuántas entraron"), se suma.
  -- 'ajuste_conteo': p_cantidad es el conteo físico absoluto ("cuánto hay
  -- ahora"), el delta se calcula como la diferencia contra lo que el
  -- sistema esperaba — esa diferencia es literalmente la discrepancia que
  -- el dueño quiere ver al cuadrar cuentas.
  v_delta := case when p_tipo = 'restock' then p_cantidad else p_cantidad - v_current end;
  v_new_qty := v_current + v_delta;

  update public.menu_item_inventory
  set cantidad_actual = v_new_qty, updated_at = now()
  where menu_item_id = p_menu_item_id;

  insert into public.inventory_movements (menu_item_id, tipo, delta, cantidad_resultante, conteo_fisico, nota, created_by)
  values (
    p_menu_item_id,
    p_tipo,
    v_delta,
    v_new_qty,
    case when p_tipo = 'ajuste_conteo' then p_cantidad else null end,
    p_nota,
    auth.uid()
  )
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.adjust_menu_item_inventory(uuid, text, numeric, text) to authenticated;
revoke execute on function public.adjust_menu_item_inventory(uuid, text, numeric, text) from anon;
