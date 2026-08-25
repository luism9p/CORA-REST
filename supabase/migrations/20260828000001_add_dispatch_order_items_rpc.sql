-- /cocina corre como anon a propósito (sin login, pantalla fija de
-- cocina) — pero order_items solo tiene policies de UPDATE para
-- `authenticated` (order_items_authenticated_all). El botón "Despachar
-- Mesa" nunca pudo escribir directo con supabase.from("order_items").update()
-- desde esa pantalla: RLS lo bloquea en silencio (0 filas afectadas, sin
-- error visible), así que en cualquier sesión sin un login de admin/mesero
-- ya activo de antes, el botón no hacía nada.
--
-- La solución no es abrir un UPDATE genérico a anon sobre toda la tabla
-- (cualquiera podría reescribir cantidad/nota/order_id de cualquier ítem)
-- sino una función angosta, como submit_table_order: solo permite la
-- transición preparando -> listo_para_servir, nada más.
create or replace function public.dispatch_order_items(p_item_ids uuid[])
returns void
language sql
security definer
set search_path = public
as $$
  update public.order_items
  set estado = 'listo_para_servir'
  where id = any(p_item_ids) and estado = 'preparando';
$$;

grant execute on function public.dispatch_order_items(uuid[]) to anon, authenticated;
