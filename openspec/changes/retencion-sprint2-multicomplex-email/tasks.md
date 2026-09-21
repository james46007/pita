# Tasks: Sprint 2 — Selector Multi-Complejo y Notificación de Confirmación por Email

## 1. Selector Multi-Complejo

- [x] 1.1 Modificar `src/lib/tenant.ts` (`getCurrentUserAndTenant`) para leer la cookie `active-complex-id` como fallback cuando no se pasa `targetComplexId`. Validar que el complejo de la cookie pertenece al usuario antes de usarla.
- [x] 1.2 Crear endpoint `POST /api/dashboard/switch-complejo` que valide que el `complexId` enviado pertenece al usuario y setee la cookie `active-complex-id` (HTTP-only, SameSite=Lax, Path=/).
- [x] 1.3 Agregar en `src/app/dashboard/layout.tsx` el componente de selector de complejo (`ComplexSwitcher` dropdown con lista de complejos del usuario y superadmin). Renderizar en sidebar y mobile header cuando existan múltiples complejos. Al cambiar, llama al endpoint 1.2 y recarga la página.

## 2. Notificación de Confirmación por Email

- [x] 2.1 Instalar Resend (`resend` en package.json). Agregar variables `RESEND_API_KEY` y `RESEND_FROM_EMAIL` a `.env`.
- [x] 2.2 Crear `src/lib/email/resend.ts` con la instancia del cliente Resend y función helper `sendEmail({ to, subject, html })`.
- [x] 2.3 Crear plantilla `src/lib/email/templates/booking-confirmed.ts` que genere el HTML responsive del email de confirmación con: nombre del jugador, complejo, cancha, fecha y horario del slot, total y botón directo de WhatsApp al complejo.
- [x] 2.4 Modificar `PATCH /api/dashboard/reservas/[id]` para, después de actualizar la reserva a `CONFIRMED`, hacer un fetch del complejo y cancha e invocar `sendEmail` de forma fire-and-forget (sin await bloqueante). Solo enviar si `booking.customerEmail` tiene valor.

## 3. Verificación

- [x] 3.1 Ejecutar `npm run build` para confirmar cero errores de compilación (38 rutas generadas exitosamente).
- [x] 3.2 Verificar selector multi-complejo y persistencia por cookie.
- [x] 3.3 Validar plantilla y dispatcher transaccional de Resend.
