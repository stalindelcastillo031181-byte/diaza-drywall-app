-- Migration: 004_alerts
-- Sistema de alertas y notificaciones

create type alert_type as enum (
  'no_checkin',
  'out_of_geofence',
  'late_arrival',
  'early_departure',
  'sync_failed',
  'general'
);

create table alerts (
  id uuid primary key default uuid_generate_v4(),
  type alert_type not null,
  message text not null,
  employee_id uuid references employees(id) on delete cascade,
  obra_id uuid references obras(id) on delete cascade,
  read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Índices
create index alerts_employee_idx on alerts(employee_id);
create index alerts_obra_idx on alerts(obra_id);
create index alerts_read_idx on alerts(read) where read = false;
create index alerts_created_at_idx on alerts(created_at desc);

-- RLS
alter table alerts enable row level security;

-- Owner y Super ven todas las alertas
create policy "owner_super_read_all_alerts"
  on alerts for select
  using (
    exists (
      select 1 from employees e
      where e.id = auth.uid()
      and e.role in ('owner', 'super')
    )
  );

-- Supervisor ve alertas de sus obras
create policy "supervisor_read_obra_alerts"
  on alerts for select
  using (
    exists (
      select 1 from employees e
      join obras o on o.supervisor_id = e.id
      where e.id = auth.uid()
      and e.role = 'supervisor'
      and o.id = alerts.obra_id
    )
  );

-- Sistema puede insertar alertas (service role)
create policy "system_insert_alerts"
  on alerts for insert
  with check (true);

-- Owner/Super marcan como leídas
create policy "owner_super_update_alerts"
  on alerts for update
  using (
    exists (
      select 1 from employees e
      where e.id = auth.uid()
      and e.role in ('owner', 'super', 'supervisor')
    )
  );

-- Realtime para alertas
alter publication supabase_realtime add table alerts;
