-- Migration: 003_attendance
-- Registros de check-in / check-out

create type attendance_type as enum ('checkin', 'checkout');

create table attendance (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references employees(id) on delete cascade,
  obra_id uuid not null references obras(id) on delete cascade,
  type attendance_type not null,
  lat double precision not null,
  lng double precision not null,
  distance_from_obra_m int,
  within_geofence boolean not null default false,
  biometric_verified boolean not null default false,
  synced_at timestamptz,
  created_at timestamptz not null default now()
);

-- Índices para performance
create index attendance_employee_idx on attendance(employee_id);
create index attendance_obra_idx on attendance(obra_id);
create index attendance_created_at_idx on attendance(created_at desc);

-- RLS
alter table attendance enable row level security;

-- Cada empleado ve sus propios registros
create policy "employee_read_own_attendance"
  on attendance for select
  using (employee_id = auth.uid());

-- Supervisors/Owner/Super ven los de su obra
create policy "supervisor_read_obra_attendance"
  on attendance for select
  using (
    exists (
      select 1 from employees e
      where e.id = auth.uid()
      and e.role in ('owner', 'super', 'supervisor')
    )
  );

-- Empleado registra su propia asistencia
create policy "employee_insert_own_attendance"
  on attendance for insert
  with check (employee_id = auth.uid());

-- Realtime habilitado para esta tabla
alter publication supabase_realtime add table attendance;
