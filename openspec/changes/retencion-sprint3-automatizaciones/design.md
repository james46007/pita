# Design: Sprint 3 — Automatizaciones (Recordatorio de Turno y Reporte Semanal)

## Context

`src/lib/metrics.ts` ya implementa el cálculo de GMV, bookings confirmados y métricas por complejo. Los datos necesarios para ambos crons ya existen en el esquema: `Booking.slot.date`, `Booking.slot.startTime`, `Booking.customerEmail`, `Booking.status`, `Complex.users` (para obtener el email del admin).

Resend estará instalado desde Sprint 2.

## Goals / Non-Goals

**Goals:**
- Recordatorio 1h antes del turno al jugador vía email.
- Reporte semanal al admin del complejo cada lunes 9am.
- Protección de los endpoints de cron contra llamadas externas no autorizadas.
- Deduplicación de recordatorios (no enviar el mismo recordatorio dos veces).

**Non-Goals:**
- Recordatorio por WhatsApp (requiere WhatsApp Business API verificada).
- Recordatorio por SMS (Twilio agrega costo y complejidad).
- Cron en infraestructura propia (Vercel Cron es suficiente en el plan Hobby).

## Decisions

### 1. Protección de los Endpoints de Cron

- **Decision**: Header `Authorization: Bearer ${CRON_SECRET}` verificado al inicio de cada handler. Si el header no coincide, responde 401.
- **Nota de Vercel**: Vercel Cron automáticamente incluye el header `Authorization: Bearer <VERCEL_CRON_SECRET>` en las invocaciones. Solo hay que definir `CRON_SECRET` como variable de entorno.

### 2. Deduplicación de Recordatorios

- **Decision**: Agregar campo `reminderSentAt DateTime?` al modelo `Booking` en Prisma. El cron filtra con:
  ```
  WHERE status = 'CONFIRMED'
    AND reminderSentAt IS NULL
    AND slot.date + slot.startTime BETWEEN now+55min AND now+65min
  ```
  Después de enviar, actualiza `reminderSentAt = now()`.
- **Alternativa rechazada**: Tabla separada `ReminderLog`. Más compleja sin beneficio adicional para el MVP.

### 3. Combinación Fecha + Hora del Slot

- **Decisión técnica**: El slot almacena `date` (DateTime @db.Date) y `startTime` (String "HH:mm"). La combinación `new Date(slot.date.toISOString().split('T')[0] + 'T' + slot.startTime)` da el DateTime exacto del turno. La comparación se hace en JavaScript, no en SQL, para evitar complejidad de queries con funciones de timestamp.

### 4. Selección del Destinatario del Reporte Semanal

- **Decision**: El email va a todos los usuarios del complejo con `role = 'ADMIN'`. Se obtienen via `Complex.users` (relación UserComplex) incluyendo el `User.email`.
- **Rationale**: El STAFF no necesita el reporte financiero completo.

### 5. Ventana del Reporte Semanal

- **Decision**: La semana reportada es `[lunes anterior 00:00 → domingo anterior 23:59]` en UTC. El cron corre el lunes siguiente a las 9am (horario del servidor, UTC).

## Risks / Trade-offs

- **[Zona horaria de los slots vs UTC del servidor]** → Los slots están guardados con fecha local sin timezone. Si el servidor está en UTC y el complejo está en UTC-5, el cron de 9am UTC equivale a 4am local — correcto para el cálculo de recordatorios. Se documenta como limitación conocida; la corrección requiere agregar `timezone` al modelo `Complex`.
- **[Plan Hobby de Vercel limita crons a 1 por minuto]** → Suficiente para el MVP. El cron de recordatorios (horario) y el de reportes (semanal) no colisionan.
- **[Si Resend falla, el cron lanza error]** → Se agrega try/catch por complejo; un fallo en uno no bloquea el procesamiento de los demás.
