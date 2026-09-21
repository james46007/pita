# Tasks: Sprint 1 — Onboarding Guiado y PWA Básica

## 1. Onboarding Guiado

- [x] 1.1 Modificar `src/app/dashboard/page.tsx` para consultar en paralelo el conteo de canchas, horarios activos y slots futuros del complejo actual vía `/api/dashboard/onboarding`. Pasar el estado de onboarding como props al componente visual.
- [x] 1.2 Crear componente `src/components/dashboard/OnboardingChecklist.tsx` con stepper de 3 pasos (Cancha → Horarios → Slots), badges de progreso y links directos a cada sección. Renderizar solo si el complejo está incompleto.
- [x] 1.3 Integrar `OnboardingChecklist` al inicio de `src/app/dashboard/page.tsx`, por encima de la agenda del día.

## 2. PWA Básica

- [x] 2.1 Crear `public/manifest.json` con `name`, `short_name`, `start_url`, `display: standalone`, `theme_color`, `background_color` y un set de iconos de la plataforma (192x192 y 512x512).
- [x] 2.2 Crear `public/sw.js` (service worker stub) que active el install prompt sin implementar caché offline agresiva.
- [x] 2.3 Agregar en `src/app/layout.tsx` los meta tags: `<link rel="manifest">`, `theme-color`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style` y el registro del service worker.
- [x] 2.4 Generar los iconos de la app (PNG 192x192 y 512x512) coherentes con la marca y colocarlos en `public/icons/`.

## 3. Verificación

- [x] 3.1 Ejecutar `npm run build` para confirmar cero errores de compilación.
- [x] 3.2 Verificar manifest y Service Worker para que el navegador identifique la app como instalable.
- [x] 3.3 Validar stepper de activación y endpoints del onboarding.
