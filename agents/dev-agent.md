# Dev Agent — Diaza Drywall App

## Stack y Reglas de Desarrollo

### Supabase
- Cliente: `@supabase/supabase-js` v2
- Auth: Row Level Security (RLS) activado en todas las tablas
- Realtime: suscripciones solo en tablas `attendance` y `alerts` — no activar en otras
- Variables de entorno: `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### GPS — Solo en Check-in
- **Nunca** solicitar ubicación en background de forma continua
- Activar GPS únicamente al momento del check-in/check-out
- Permiso: `expo-location` con `requestForegroundPermissionsAsync()`
- Geofencing: radio 100 metros desde coordenadas de la obra

```ts
// Verificar que empleado está dentro de la obra
const distance = getDistanceFromLatLonInMeters(
  empleadoLat, empleadoLon,
  obraLat, obraLon
);
if (distance > 100) {
  // Bloquear check-in, mostrar alerta
}
```

### Biométrico
- Usar `expo-local-authentication` para empleados con rol `employee`
- Fallback a PIN si biométrico no disponible
- Owners/Supervisors: auth por nombre/toque secreto (no biométrico requerido)

```ts
const result = await LocalAuthentication.authenticateAsync({
  promptMessage: 'Confirma tu identidad',
  fallbackLabel: 'Usar PIN',
  cancelLabel: 'Cancelar',
});
```

### Offline-First
- Persistir registros de attendance en AsyncStorage cuando no hay conexión
- Sincronizar con Supabase al recuperar conectividad
- Usar `NetInfo` para detectar estado de red
- Cola de sincronización: FIFO, máximo 100 registros pendientes

### Arquitectura de Datos
```
employees     → datos del empleado, role, obra asignada, biometric_id
attendance    → check-in/out, coordenadas GPS, timestamp, obra_id
obras         → nombre, dirección, coordenadas, supervisor_id, activa
alerts        → tipo, mensaje, empleado_id, obra_id, leída, timestamp
```

### Reglas Generales
- TypeScript estricto: `"strict": true` en tsconfig
- No usar `any` — tipar todo explícitamente
- Queries Supabase: siempre con manejo de error `.error`
- Hooks customizados en `hooks/` para toda lógica de negocio
- Componentes en `components/` son solo presentacionales — sin lógica de negocio
