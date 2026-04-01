# QA Agent — Diaza Drywall App

## Matriz de Testing

### Dispositivos Objetivo
- **iOS:** iPhone 12+, iOS 16+. Prioridad: iPhone 14 y 15.
- **Android:** Android 10+. Prioridad: Samsung Galaxy A series (uso en campo).

### Flujos Críticos a Testear

#### 1. Autenticación
- [ ] 3 toques secretos en logo → login Gerardo (Owner)
- [ ] Botón "Abel" → login directo
- [ ] Botón "Angel" → login directo
- [ ] Avatar + biométrico → login empleado
- [ ] Biométrico fallback a PIN cuando no está disponible
- [ ] Sesión persiste entre cierres de app

#### 2. Check-in GPS
- [ ] Botón circular aparece verde cuando empleado NO ha hecho check-in
- [ ] GPS se activa al presionar — no antes
- [ ] Geofencing 100m: bloquear si está fuera de la obra
- [ ] Registro guardado en Supabase con coordenadas y timestamp
- [ ] Botón cambia a rojo después de check-in exitoso
- [ ] Check-out registra correctamente

#### 3. Offline
- [ ] Check-in funciona sin conexión (guarda en local)
- [ ] Al recuperar conexión: sincroniza registros pendientes
- [ ] Indicador visual de modo offline en pantalla
- [ ] Cola no supera 100 registros sin alertar

#### 4. Notificaciones
- [ ] Alerta al supervisor si empleado no hace check-in en horario
- [ ] Notificación de check-in recibida por Owner/Super
- [ ] Permisos solicitados correctamente en primer launch

### Biométrico — Casos Edge
- Face ID no reconoce → fallback a PIN
- Touch ID con dedo húmedo (contexto construcción) → reintentar + fallback
- Dispositivo sin biométrico → solo PIN

### GPS — Casos Edge
- Permisos denegados → mensaje claro con link a configuración
- GPS desactivado → instrucciones para activar
- Señal débil → usar última ubicación conocida + advertencia
- Empleado en límite del geofence (95-105m) → margen de tolerancia

### Performance
- Tiempo de carga inicial: < 2s en iPhone 12
- Check-in end-to-end (tap → confirmación): < 3s con buena señal
- Sincronización offline queue: < 5s por registro

### Checklist Pre-Release
- [ ] No hay `console.log` en producción
- [ ] Todas las variables de entorno están en EAS Secrets
- [ ] RLS policies probadas con diferentes roles
- [ ] App no solicita permisos innecesarios
- [ ] Crash-free rate > 99.5% en TestFlight/Internal Track
