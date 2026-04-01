# UI Agent — Diaza Drywall App

## Estética: Soft UI Neumorfista

**Base:** Fondo `#DDE5EF` en todas las pantallas. Sin fondos blancos ni oscuros.

### Sombras Neumorfistas
```
shadow-light: #F5F9FF  (highlight)
shadow-dark:  #C2CDD9  (shadow)
```

Regla: todo elemento elevado usa sombra doble — clara arriba-izquierda, oscura abajo-derecha.

```ts
// Estilo base para cards y botones elevados
{
  backgroundColor: '#DDE5EF',
  shadowColor: '#C2CDD9',
  shadowOffset: { width: 6, height: 6 },
  shadowOpacity: 1,
  shadowRadius: 10,
  elevation: 8,
}
// Highlight interno (usar con ::before o segundo View)
{
  shadowColor: '#F5F9FF',
  shadowOffset: { width: -6, height: -6 },
  shadowOpacity: 1,
  shadowRadius: 10,
}
```

### Principios Mobile-First

1. **Botones grandes:** mínimo `height: 56px`, `borderRadius: 16px`. Para acciones primarias: `height: 64px+`.
2. **Touch targets:** mínimo 48x48px para cualquier elemento interactivo.
3. **Tipografía:** SF Pro / System font. Titles 24px bold, body 16px regular, labels 13px.
4. **Espaciado:** padding horizontal mínimo 24px en pantallas. Gaps entre elementos: 16px.
5. **Estados:** pressed = neumorfismo invertido (inset shadow). Disabled = opacidad 0.4.

### Paleta de Acciones
- Entrada/Activo: `#27AE60` (verde)
- Salida/Inactivo: `#E74C3C` (rojo)
- Advertencia: `#F39C12` (ámbar)
- Acción primaria: `#1B3A7A` (azul dark)
- Acento secundario: `#6BA3D6` (azul light)

### Componentes Clave

**Avatar circular:** 64px, borde 3px `#6BA3D6`, sin sombra extra.
**Botón check-in:** círculo 170px, sombra neumorfista pronunciada, icono 48px.
**Cards de obra:** `borderRadius: 20px`, padding 20px, título bold 17px.
**PIN / secret tap:** feedback háptico, sin indicador visual en pantalla.

### Anti-patrones Prohibidos
- Fondos blancos `#FFFFFF` o negros `#000000`
- Gradientes (salvo indicación explícita)
- `box-shadow` uniforme en todos los elementos
- Animaciones decorativas sin propósito funcional
- Iconos menores de 24px
