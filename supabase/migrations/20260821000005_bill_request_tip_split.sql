-- Al pedir la cuenta, el cliente puede elegir propina y dividir entre N
-- personas; esto lo ve el mesero en el panel para saber el monto final a
-- cobrar. Columnas nulas para las solicitudes de tipo 'mesero'.
alter table public.table_requests
  add column propina numeric(10,2),
  add column personas integer,
  add column total_a_cobrar numeric(10,2);
