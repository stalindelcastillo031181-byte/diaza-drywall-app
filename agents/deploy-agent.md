# Deploy Agent — Diaza Drywall App

## EAS Build (Expo Application Services)

### Configuración
```json
// eas.json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false },
      "android": { "buildType": "apk" }
    },
    "production": {
      "ios": { "buildType": "archive" },
      "android": { "buildType": "app-bundle" }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Secrets — Solo en EAS, nunca en el repo
```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   (solo backend/edge functions)
```

Comando para agregar secret:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://..."
```

### Comandos de Build
```bash
# Development build (dispositivo físico)
eas build --profile development --platform all

# Preview (distribución interna)
eas build --profile preview --platform all

# Producción
eas build --profile production --platform all
```

### Vercel — Auto-deploy (Admin Dashboard futuro)
- Repo: `stalindelcastillo031181-byte/diaza-drywall-app`
- Branch `main` → auto-deploy a producción
- Branch `develop` → auto-deploy a preview
- Variables de entorno configuradas en Vercel Dashboard

### Flujo de Release
1. Feature branch → PR a `develop`
2. QA aprueba en `develop`
3. PR de `develop` a `main`
4. EAS Build automático en merge a `main`
5. OTA Update para cambios que no requieren build nativo

### OTA Updates (Over-the-Air)
```bash
eas update --branch production --message "Fix: descripción del cambio"
```
Solo para cambios en JS/TS — sin cambios en código nativo.
