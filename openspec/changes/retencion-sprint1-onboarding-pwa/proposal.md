# Proposal: Sprint 1 — Onboarding Guiado y PWA Básica

## Why

El primer día de uso es el momento más crítico para retener al dueño del complejo. Si al entrar al dashboard no sabe qué hacer (crear canchas, configurar horarios, generar slots), abandona o llama a soporte. Además, el sistema no es instalable en el celular del dueño, lo que lo hace sentir como una "página web" y no como un producto profesional.

## What Changes

### Onboarding Guiado (Feature #7)
- Detectar el estado de configuración del complejo al cargar el dashboard: sin canchas, sin horarios, sin slots.
- Mostrar un componente de checklist progresivo en `/dashboard` cuando la cuenta está incompleta, reemplazando o complementando el dashboard normal.
- Cada paso del checklist vincula directamente a la sección correspondiente y muestra progreso visual (1/3, 2/3, 3/3).
- Desaparece automáticamente cuando los 3 pasos están completos.

### PWA Básica (Feature #10)
- Agregar `public/manifest.json` con nombre de la app, iconos y colores corporativos.
- Agregar `public/sw.js` (service worker mínimo para que Chrome/Safari muestren el prompt de instalación).
- Agregar meta tags de PWA en el root layout (`src/app/layout.tsx`): `theme-color`, `apple-mobile-web-app-capable`, `viewport`.
- La experiencia resultante: el dueño puede instalar el dashboard como app en su celular con ícono en la pantalla de inicio.

## Capabilities

### New Capabilities
- `onboarding-dashboard`: Flujo guiado de configuración inicial para nuevos complejos.

### Modified Capabilities
- `dashboard-admin`: Visualización condicional del wizard de onboarding cuando el complejo carece de canchas, horarios o slots.

## Impact
- **APIs**: Solo lectura — se reutilizan los endpoints existentes de canchas, horarios y slots para verificar el estado.
- **UI**: Nuevo componente `OnboardingChecklist` en `/dashboard`. Modificación menor de `src/app/layout.tsx`.
- **Archivos estáticos**: `public/manifest.json`, `public/icons/`, `public/sw.js`.
- **Database**: Sin cambios de esquema.
