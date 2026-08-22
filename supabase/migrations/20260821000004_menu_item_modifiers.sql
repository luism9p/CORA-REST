-- Modificadores estructurados por plato (ej. "Extra queso parmesano +S/3.00",
-- "Sin ají" +S/0.00), configurables desde el admin.

create table public.menu_item_modifiers (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  nombre text not null,
  precio_extra numeric(10,2) not null default 0 check (precio_extra >= 0),
  created_at timestamptz not null default now()
);

create index idx_menu_item_modifiers_menu_item_id on public.menu_item_modifiers(menu_item_id);

-- Snapshot de los modificadores elegidos al momento del pedido (no referencia
-- en vivo a menu_item_modifiers): si el admin edita o borra un modificador
-- después, los pedidos ya hechos no deben cambiar de precio retroactivamente.
create table public.order_item_modifiers (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  nombre text not null,
  precio_extra numeric(10,2) not null default 0
);

create index idx_order_item_modifiers_order_item_id on public.order_item_modifiers(order_item_id);

alter table public.menu_item_modifiers enable row level security;
alter table public.order_item_modifiers enable row level security;

create policy "menu_item_modifiers_public_select" on public.menu_item_modifiers
  for select to anon, authenticated using (true);
create policy "menu_item_modifiers_authenticated_write" on public.menu_item_modifiers
  for all to authenticated using (true) with check (true);

create policy "order_item_modifiers_public_insert" on public.order_item_modifiers
  for insert to anon, authenticated with check (true);
create policy "order_item_modifiers_public_select" on public.order_item_modifiers
  for select to anon, authenticated using (true);
create policy "order_item_modifiers_authenticated_all" on public.order_item_modifiers
  for all to authenticated using (true) with check (true);
