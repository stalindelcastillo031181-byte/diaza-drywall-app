-- Seed: Obras y Empleados — Diaza Drywall App
-- Datos iniciales para desarrollo y QA

-- =====================
-- OBRAS
-- =====================

insert into obras (id, name, address, city, lat, lng, geofence_radius_m, active) values
  (
    'a1000000-0000-0000-0000-000000000001',
    'Hialeah Commercial Center',
    '5800 W 16th Ave',
    'Hialeah',
    25.8576, -80.2781,
    100,
    true
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'Kendall Residential',
    '11200 SW 88th St',
    'Kendall',
    25.7031, -80.3742,
    100,
    true
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'Doral Office Park',
    '3250 NW 87th Ave',
    'Doral',
    25.8197, -80.3536,
    100,
    true
  );

-- =====================
-- EMPLEADOS
-- =====================

-- Owner
insert into employees (id, name, role, active) values
  (
    'b1000000-0000-0000-0000-000000000001',
    'Gerardo',
    'owner',
    true
  );

-- Super
insert into employees (id, name, role, active) values
  (
    'b1000000-0000-0000-0000-000000000002',
    'Abel',
    'super',
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'Angel',
    'super',
    true
  );

-- Supervisores
insert into employees (id, name, role, obra_id, active) values
  (
    'b1000000-0000-0000-0000-000000000004',
    'Carlos',
    'supervisor',
    'a1000000-0000-0000-0000-000000000001',
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000005',
    'José',
    'supervisor',
    'a1000000-0000-0000-0000-000000000002',
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000006',
    'Luis',
    'supervisor',
    'a1000000-0000-0000-0000-000000000003',
    true
  );

-- Empleados de campo
insert into employees (id, name, role, obra_id, active) values
  (
    'b1000000-0000-0000-0000-000000000007',
    'Miguel',
    'employee',
    'a1000000-0000-0000-0000-000000000001',
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000008',
    'Roberto',
    'employee',
    'a1000000-0000-0000-0000-000000000001',
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000009',
    'Felipe',
    'employee',
    'a1000000-0000-0000-0000-000000000002',
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000010',
    'Hugo',
    'employee',
    'a1000000-0000-0000-0000-000000000003',
    true
  );

-- Asignar supervisores a obras
update obras set supervisor_id = 'b1000000-0000-0000-0000-000000000004' where id = 'a1000000-0000-0000-0000-000000000001';
update obras set supervisor_id = 'b1000000-0000-0000-0000-000000000005' where id = 'a1000000-0000-0000-0000-000000000002';
update obras set supervisor_id = 'b1000000-0000-0000-0000-000000000006' where id = 'a1000000-0000-0000-0000-000000000003';
