-- Módulo de pedidos por mesa para CORA.
-- Esquema validado en producción en un proyecto anterior (Don Lucho); se aplica
-- aquí tal cual, ya como resultado final de varias iteraciones.

-- Estado de pedido
create type order_status as enum ('nuevo', 'preparando', 'listo', 'entregado');

-- Mesas físicas
create table public.tables (
  id serial primary key,
  numero integer not null unique,
  activa boolean not null default true
);

-- Ítems del menú
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  precio numeric(10,2) not null check (precio >= 0),
  categoria text not null,
  imagen_url text,
  disponible boolean not null default true,
  created_at timestamptz not null default now()
);

-- Pedidos
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  table_id integer not null references public.tables(id),
  estado order_status not null default 'nuevo',
  total numeric(10,2) not null default 0 check (total >= 0),
  notas text,
  metodo_pago text check (metodo_pago in ('efectivo', 'yape', 'plin', 'tarjeta')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ítems de cada pedido
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id),
  cantidad integer not null check (cantidad > 0),
  nota text,
  listo boolean not null default false
);

-- Solicitudes de mesa (llamar mesero / pedir cuenta)
create table public.table_requests (
  id uuid primary key default gen_random_uuid(),
  table_id integer not null references public.tables(id),
  tipo text not null check (tipo in ('mesero', 'cuenta')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'atendido')),
  created_at timestamptz not null default now()
);

create index idx_orders_table_id on public.orders(table_id);
create index idx_orders_estado on public.orders(estado);
create index idx_order_items_order_id on public.order_items(order_id);
create index idx_table_requests_table_id on public.table_requests(table_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

-- RLS
alter table public.tables enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.table_requests enable row level security;

create policy "tables_public_select" on public.tables
  for select to anon, authenticated using (true);
create policy "tables_authenticated_write" on public.tables
  for all to authenticated using (true) with check (true);

create policy "menu_items_public_select" on public.menu_items
  for select to anon, authenticated using (true);
create policy "menu_items_authenticated_write" on public.menu_items
  for all to authenticated using (true) with check (true);

-- IMPORTANTE: insert a anon Y authenticated (si no, probar el flujo de cliente
-- logueado como admin en el mismo navegador falla con "row violates RLS policy")
create policy "orders_public_insert" on public.orders
  for insert to anon, authenticated with check (true);
create policy "orders_public_select" on public.orders
  for select to anon, authenticated using (true);
create policy "orders_authenticated_update" on public.orders
  for update to authenticated using (true) with check (true);
create policy "orders_authenticated_delete" on public.orders
  for delete to authenticated using (true);

create policy "order_items_public_insert" on public.order_items
  for insert to anon, authenticated with check (true);
create policy "order_items_public_select" on public.order_items
  for select to anon, authenticated using (true);
create policy "order_items_authenticated_all" on public.order_items
  for all to authenticated using (true) with check (true);

create policy "table_requests_public_insert" on public.table_requests
  for insert to anon, authenticated with check (true);
create policy "table_requests_authenticated_select" on public.table_requests
  for select to authenticated using (true);
create policy "table_requests_authenticated_update" on public.table_requests
  for update to authenticated using (true) with check (true);

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.table_requests;

-- Seed de las 12 mesas
insert into public.tables (numero, activa)
select numero, true from generate_series(1, 12) as numero
on conflict (numero) do nothing;
