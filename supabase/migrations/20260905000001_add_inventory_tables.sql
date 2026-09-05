-- Sistema de inventario: el dueño quiere dejar el restaurante funcionando
-- sin supervisión y después poder "cuadrar cuentas" (¿de verdad se
-- vendieron 3 Coca-Colas? ¿el conteo físico coincide con lo que el sistema
-- dice que debería quedar?). Hoy `menu_items.disponible` es solo un
-- booleano de agotado/no agotado — no existe ningún contador de stock.

-- Interruptor opt-in por producto: no todos los platos llevan inventario
-- (un ceviche recién hecho no se cuenta igual que una gaseosa embotellada).
-- menu_items_authenticated_write ya permite escribir esta columna directo
-- desde /admin, igual que `disponible` — no hace falta ninguna función para
-- prenderla/apagarla salvo cuando se activa por primera vez con stock
-- inicial (ver enable_menu_item_inventory en la siguiente migración).
alter table public.menu_items add column inventariable boolean not null default false;

-- Contador vivo, una fila por producto con inventario activado. Sin CHECK
-- >= 0 a propósito: el dueño no pidió bloquear una venta por falta de
-- stock, solo descontar y poder auditar — un número negativo es la señal
-- de "se vendió más de lo que se registró como disponible" y debe verse,
-- no esconderse detrás de un error de base de datos que además rompería
-- el pedido del cliente.
create table public.menu_item_inventory (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null unique references public.menu_items(id) on delete cascade,
  cantidad_actual numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ledger de auditoría: esto es lo que de verdad responde "cuadrar
-- cuentas" — no solo el número actual, sino el historial completo de cada
-- venta automática, reabastecimiento y conteo físico con su diferencia.
create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  tipo text not null check (tipo in ('venta', 'restock', 'ajuste_conteo')),
  delta numeric not null,
  cantidad_resultante numeric not null,
  order_item_id uuid references public.order_items(id) on delete set null,
  conteo_fisico numeric,
  nota text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index inventory_movements_menu_item_id_created_at_idx
  on public.inventory_movements (menu_item_id, created_at desc);

-- RLS deliberadamente más estricto que el resto del proyecto: ninguna
-- policy de INSERT/UPDATE/DELETE para ningún rol, ni siquiera
-- `authenticated`. Toda escritura pasa por las funciones security definer
-- de las próximas dos migraciones — así el ledger nunca puede
-- desincronizarse del contador por un .update() suelto desde el frontend
-- (o desde el editor de tablas de Supabase). Es una restricción nueva en
-- este proyecto: hasta ahora `disponible` sí se edita directo.
alter table public.menu_item_inventory enable row level security;
create policy menu_item_inventory_authenticated_select
  on public.menu_item_inventory for select to authenticated using (true);

alter table public.inventory_movements enable row level security;
create policy inventory_movements_authenticated_select
  on public.inventory_movements for select to authenticated using (true);
