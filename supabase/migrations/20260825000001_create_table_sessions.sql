-- Respaldo del check-in por geolocalización (Edge Function check-in): una
-- fila por escaneo NFC validado (dentro del radio del local y en horario),
-- con vencimiento de 3 horas. Solo la función la escribe, usando la Service
-- Role Key — a propósito no hay ninguna policy pública de INSERT/UPDATE/
-- SELECT. Si el cliente pudiera escribir aquí directamente desde el
-- navegador, podría fabricarse una sesión válida sin pasar por la
-- validación de distancia/horario, que es justo lo que esta tabla existe
-- para impedir.
create table if not exists public.table_sessions (
  id uuid primary key default gen_random_uuid(),
  session_token uuid not null unique,
  table_id integer not null references public.tables(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table public.table_sessions enable row level security;
