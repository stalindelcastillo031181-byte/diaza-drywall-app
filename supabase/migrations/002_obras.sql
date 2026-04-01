-- Migration: 002_obras
-- Tabla de obras / proyectos de construcción

create table obras (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text not null,
  city text not null,
  lat double precision not null,
  lng double precision not null,
  geofence_radius_m int not null default 100,
  supervisor_id uuid references employees(id) on delete set null,
  active boolean not null default true,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table obras enable row level security;

-- Todos los empleados activos pueden ver obras activas
create policy "employees_read_active_obras"
  on obras for select
  using (
    active = true
    and exists (
      select 1 from employees e
      where e.id = auth.uid()
      and e.active = true
    )
  );

-- Solo owner y super gestionan obras
create policy "owner_super_manage_obras"
  on obras for all
  using (
    exists (
      select 1 from employees e
      where e.id = auth.uid()
      and e.role in ('owner', 'super')
    )
  );

create trigger obras_updated_at
  before update on obras
  for each row execute function update_updated_at();
