-- Permite que el toggle de "Agotado" en el admin se refleje al instante en
-- el celular del cliente (sin recargar), igual que ya pasa con orders/order_items.
alter publication supabase_realtime add table public.menu_items;
