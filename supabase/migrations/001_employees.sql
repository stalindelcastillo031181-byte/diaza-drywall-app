-- Migration: 001_employees
-- Tabla principal de empleados

create extension if not exists "uuid-ossp";

create type employee_role as enum ('owner', 'super', 'supervisor', 'employee');

create table employees (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  role employee_role not null default 'employee',
  obra_id uuid references obras(id) on delete set null,
  biometric_id text,
  pin_hash text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table employees enable row level security;

-- Owner y Super ven todos los empleados
create policy "owner_super_read_all_employees"
  on employees for select
  using (
    exists (
      select 1 from employees e
      where e.id = auth.uid()
      and e.role in ('owner', 'super')
    )
  );

-- Cada empleado se ve a sí mismo
create policy "employee_read_self"
  on employees for select
  using (id = auth.uid());

-- Solo owner puede crear/modificar empleados
create policy "owner_manage_employees"
  on employees for all
  using (
    exists (
      select 1 from employees e
      where e.id = auth.uid()
      and e.role = 'owner'
    )
  );

-- Trigger: updated_at automático
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger employees_updated_at
  before update on employees
  for each row execute function update_updated_at();
