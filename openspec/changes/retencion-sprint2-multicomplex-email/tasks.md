# Tasks: Sprint 2 — Selector Multi-Complejo y Notificación de Confirmación por Email

## 1. Selector Multi-Complejo

- [ ] 1.1 Instalar `resend` no es necesario en este punto. Modificar `src/lib/tenant.ts` (`getCurrentUserAndTenant`) para leer la cookie `active-complex-id` como fallback cuando no se pasa `targetComplexId`. Validar que el complejo de la cookie pertenece al usuario antes de usarla.
- [ ] 1.2 Crear endpoint `POST /api/dashboard/switch-complejo` que valide que el `complexId` enviado pertenece al usuario y setee la cookie `active-complex-id` (HTTP-only, SameSite=Lax, Path=/dashboard).
- [ ] 1.3 Agregar en `src/app/dashboard/layout.tsx` el componente de selector de complejo (dropdown con lista de complejos del usuario). Renderizar solo si `user.complexes.length > 1`. Al cambiar, llama al endpoint 1.2 y recarga la página.

## 2. Notificación de Confirmación por Email

- [ ] 2.1 Instalar Resend: `pnpm add resend`. Agregar `RESEND_API_KEY` al `.env` y al entorno de producción en Vercel.
- [ ] 2.2 Crear `src/lib/email/resend.ts` con la instancia del cliente Resend y función helper `sendEmail({ to, subject, html })`.
- [ ] 2.3 Crear plantilla `src/lib/email/templates/booking-confirmed.ts` que genere el HTML del email de confirmación con: nombre del jugador, complejo, cancha, fecha y horario del slot, y teléfono de contacto del complejo.
- [ ] 2.4 Modificar `PATCH /api/dashboard/reservas/[id]` para, después de actualizar la reserva a `CONFIRMED`, hacer un fetch del complejo (nombre, teléfono) e invocar `sendEmail` de forma fire-and-forget (sin await bloqueante). Solo enviar si `booking.customerEmail` tiene valor.

## 3. Verificación

- [ ] 3.1 Ejecutar `npm run build` para confirmar cero errores de compilación.
- [ ] 3.2 Probar el selector multi-complejo con un usuario que tenga 2 complejos asignados: verificar que al cambiar, el dashboard muestra los datos del nuevo complejo activo.
- [ ] 3.3 Probar el email: confirmar una reserva que tenga `customerEmail` y verificar la llegada del email en la bandeja de entrada (y no en spam si el dominio está verificado en Resend).
