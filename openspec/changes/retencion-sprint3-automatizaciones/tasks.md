# Tasks: Sprint 3 — Automatizaciones (Recordatorio de Turno y Reporte Semanal)

## Prerequisito

- Sprint 2 completado (Resend instalado y `RESEND_API_KEY` configurada en Vercel).

## 1. Infraestructura de Cron

- [ ] 1.1 Crear `vercel.json` en la raíz del proyecto con la configuración de los dos crons:
  - `GET /api/cron/recordatorios` — schedule `"0 * * * *"` (cada hora en punto).
  - `GET /api/cron/reporte-semanal` — schedule `"0 9 * * 1"` (lunes 9am UTC).
- [ ] 1.2 Agregar `CRON_SECRET` como variable de entorno en `.env` (local) y en el panel de Vercel. Crear helper `src/lib/cron-auth.ts` con función `assertCronSecret(req)` que valide el header `Authorization`.

## 2. Recordatorio Automático de Turno

- [ ] 2.1 Modificar `prisma/schema.prisma` para agregar campo `reminderSentAt DateTime?` al modelo `Booking`. Ejecutar migración (`npx prisma db push`).
- [ ] 2.2 Crear `src/app/api/cron/recordatorios/route.ts` con handler `GET` que:
  1. Valide `CRON_SECRET`.
  2. Calcule ventana [now+55min, now+65min].
  3. Busque bookings CONFIRMED con slot en esa ventana y `reminderSentAt IS NULL`.
  4. Por cada booking: genere el email de recordatorio y lo envíe con Resend.
  5. Actualice `reminderSentAt = now()`.
- [ ] 2.3 Crear plantilla `src/lib/email/templates/booking-reminder.ts` con HTML del recordatorio: nombre jugador, cancha, fecha, hora, dirección del complejo.

## 3. Reporte Semanal al Dueño

- [ ] 3.1 Crear `src/app/api/cron/reporte-semanal/route.ts` con handler `GET` que:
  1. Valide `CRON_SECRET`.
  2. Calcule ventana [lunes anterior 00:00 UTC → domingo anterior 23:59 UTC].
  3. Para cada complejo con `isActive=true` y subscription no INACTIVE: obtenga métricas de la semana usando `src/lib/metrics.ts`.
  4. Obtenga emails de todos los `UserComplex` con `role=ADMIN`.
  5. Envíe el reporte por Resend a cada admin. Procese cada complejo en try/catch independiente.
- [ ] 3.2 Crear plantilla `src/lib/email/templates/weekly-report.ts` con HTML del reporte: reservas totales, ingresos confirmados, cancha más activa, y un CTA al dashboard.

## 4. Verificación

- [ ] 4.1 Ejecutar `npm run build` para confirmar cero errores.
- [ ] 4.2 Probar el endpoint de recordatorios localmente llamando `GET /api/cron/recordatorios` con el header correcto. Crear un slot para dentro de 60 minutos y verificar el envío.
- [ ] 4.3 Probar el endpoint de reporte semanal llamando con el header correcto. Verificar que el email llega con los datos de la semana anterior.
- [ ] 4.4 Verificar en el dashboard de Vercel que los crons aparecen listados y se ejecutan correctamente después del primer deploy con `vercel.json`.
