# Tasks: Control de Suscripción y Período de Prueba

## 1. Base de Datos y Modelo de Datos

- [x] 1.1 Modificar `prisma/schema.prisma` agregando enum `SubscriptionStatus` (`TRIAL`, `GRACE`, `ACTIVE`, `SUSPENDED`, `INACTIVE`) y los campos `subscriptionStatus`, `trialEndsAt`, `trialDays` y `gracePeriodDays` en el modelo `Complex`.
- [x] 1.2 Ejecutar migración de base de datos (`npx prisma db push` o `npx prisma migrate dev`) y regenerar el cliente Prisma (`npx prisma generate`).

## 2. Lógica de Negocio y Guard de Suscripción

- [x] 2.1 Crear `src/lib/subscription.ts` con la función `getSubscriptionState(complex)` que calcule dinámicamente el estado efectivo (`TRIAL`, `GRACE`, `SUSPENDED`, `ACTIVE`, `INACTIVE`), días restantes y flags de escritura permitida.
- [x] 2.2 Crear `src/lib/subscription-guard.ts` con `assertSubscriptionWriteAccess(complexId)` que consulte el estado y lance `Error("SUBSCRIPTION_EXPIRED")` si el complejo está en modo de solo lectura.
- [x] 2.3 Proteger endpoints de mutación integrando el guard en `src/app/api/dashboard/reservas/manual/route.ts` y en `src/app/api/dashboard/canchas/route.ts`, devolviendo HTTP 402 en caso de vencimiento.

## 3. Endpoints de Consulta y Gestión de Suscripción

- [x] 3.1 Implementar endpoint `GET /api/dashboard/suscripcion/estado` que retorne el estado de suscripción del complejo actual para consumo del frontend.
- [x] 3.2 Implementar endpoint `PATCH /api/admin/complejos/[id]/suscripcion` protegido para SuperAdmin que permita actualizar el estado, prorrogar `trialEndsAt` o ajustar días de prueba y gracia.

## 4. Interfaz de Usuario y Notificaciones

- [x] 4.1 Crear componente `src/components/dashboard/SubscriptionBanner.tsx` e integrarlo en `src/app/dashboard/layout.tsx` para mostrar avisos informativos según el estado (trial, advertencia de gracia, o aviso de solo lectura con botón de WhatsApp de soporte).
- [x] 4.2 Actualizar `src/app/admin/complejos/page.tsx` para incluir la columna de estado de suscripción con badges visuales y botones de acción rápida ("Activar", "+15 Días", "Suspender").

## 5. Verificación y Pruebas

- [x] 5.1 Ejecutar `npm run build` para validar que no existan errores de tipos ni regresiones de compilación.
- [x] 5.2 Realizar prueba manual simulando vencimiento de trial y verificando la denegación de reserva manual con error 402 y la persistencia de lectura de datos históricos.
