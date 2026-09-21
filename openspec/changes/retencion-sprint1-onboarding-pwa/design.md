# Design: Sprint 1 — Onboarding Guiado y PWA Básica

## Context

El dashboard actual en `/dashboard/page.tsx` (15 KB) muestra la agenda del día directamente, sin considerar si el complejo tiene canchas configuradas. Un complejo nuevo sin canchas muestra una agenda vacía sin indicación de qué hacer. No existe ningún flujo de bienvenida ni guía para el primer uso.

El portal público en `src/app/tenants/[slug]` ya está funcional, pero el acceso web desde móvil no ofrece instalación como app.

## Goals / Non-Goals

**Goals:**
- Reducir a cero las llamadas de soporte de "¿Cómo empiezo?" el primer día.
- Guiar al dueño en exactamente 3 pasos: crear cancha → configurar horarios → generar slots.
- Permitir que el dashboard sea instalable como PWA en iOS y Android sin publicar en tiendas.

**Non-Goals:**
- Onboarding para el portal del jugador (fuera de alcance).
- Notificaciones push (requieren infraestructura adicional, se ve en Sprint 3).
- Onboarding multi-complejo (se aborda en Sprint 2).

## Decisions

### 1. Detección del Estado de Configuración

- **Decision**: En el Server Component de `/dashboard/page.tsx`, consultar en paralelo:
  ```
  prisma.court.count({ where: { complexId } })
  prisma.availableSchedule.count({ where: { court: { complexId } } })
  prisma.slot.count({ where: { court: { complexId }, date: { gte: hoy } } })
  ```
- **Rationale**: 3 queries ligeras en paralelo (`Promise.all`). No requiere esquema nuevo.
- **Umbral**: Si `courts === 0`, onboarding en paso 1. Si `courts > 0 && schedules === 0`, paso 2. Si `schedules > 0 && slots === 0`, paso 3. Si todo OK, dashboard normal.

### 2. Diseño del Checklist

- **Decision**: Componente `OnboardingChecklist` tipo "stepper" horizontal en la parte superior del dashboard, con 3 pasos numerados:
  1. ✅ o ⬜ **Crea tu primera cancha** → link a `/dashboard/canchas`
  2. ✅ o ⬜ **Configura los horarios** → link a `/dashboard/horarios`
  3. ✅ o ⬜ **Genera los primeros slots** → link a `/dashboard/slots`
- **Rationale**: Diseño lineal y claro. El dueño no necesita leer documentación.

### 3. PWA — Alcance Mínimo Funcional

- **Decision**: Solo `manifest.json` + meta tags. El service worker será un stub vacío (sin estrategia de caché offline) para activar el install prompt sin riesgo de stale content.
- **Rationale**: Un SW con cache agresivo puede servir versiones viejas del dashboard y confundir al usuario. El objetivo aquí es solo la instalabilidad, no el offline real.

## Risks / Trade-offs

- **[Checklist no desaparece si el complejo crea canchas en otra pestaña]** → Aceptable en MVP. Se resolverá con revalidación de Next.js o polling opcional en el futuro.
- **[iOS Safari requiere gestos del usuario para mostrar el install prompt]** → Se agrega un pequeño botón "Instalar App" en el header del dashboard que abre instrucciones manuales para iOS.
