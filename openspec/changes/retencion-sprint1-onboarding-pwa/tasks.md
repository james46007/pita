# Tasks: Sprint 1 — Onboarding Guiado y PWA Básica

## 1. Onboarding Guiado

- [ ] 1.1 Modificar `src/app/dashboard/page.tsx` para consultar en paralelo el conteo de canchas, horarios activos y slots futuros del complejo actual. Pasar el estado de onboarding como props al componente visual.
- [ ] 1.2 Crear componente `src/components/dashboard/OnboardingChecklist.tsx` con stepper de 3 pasos (Cancha → Horarios → Slots), badges de progreso y links directos a cada sección. Renderizar solo si el complejo está incompleto.
- [ ] 1.3 Integrar `OnboardingChecklist` al inicio de `src/app/dashboard/page.tsx`, por encima de la agenda del día.

## 2. PWA Básica

- [ ] 2.1 Crear `public/manifest.json` con `name`, `short_name`, `start_url`, `display: standalone`, `theme_color`, `background_color` y un set de iconos de la plataforma (192x192 y 512x512).
- [ ] 2.2 Crear `public/sw.js` (service worker stub) que active el install prompt sin implementar caché offline agresiva.
- [ ] 2.3 Agregar en `src/app/layout.tsx` los meta tags: `<link rel="manifest">`, `theme-color`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style` y el registro del service worker.
- [ ] 2.4 Generar los iconos de la app (PNG 192x192 y 512x512) coherentes con la marca y colocarlos en `public/icons/`.

## 3. Verificación

- [ ] 3.1 Ejecutar `npm run build` para confirmar cero errores de compilación.
- [ ] 3.2 Abrir Chrome DevTools → Lighthouse → verificar que la auditoría PWA pasa los checks de "Installable".
- [ ] 3.3 Probar el flujo de onboarding con un complejo recién creado: verificar que el checklist aparece en el paso correcto y desaparece al completar los 3 pasos.
