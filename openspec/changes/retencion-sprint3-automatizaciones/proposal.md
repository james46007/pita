# Proposal: Sprint 3 — Automatizaciones (Recordatorio de Turno y Reporte Semanal)

## Why

Con el primer cliente adquirido y pagando, el siguiente nivel de fidelización son las automatizaciones que hacen que el sistema "trabaje solo":

1. **Recordatorio automático de turno (#8)**: Reduce el ausentismo (no-shows) en las canchas. El jugador recibe un aviso 1 hora antes de su turno. El dueño deja de enviar mensajes manuales.

2. **Reporte semanal al dueño (#9)**: Cada lunes a las 9am, el administrador recibe un resumen de la semana anterior: reservas totales, ingresos, canchas más populares. No necesita entrar al dashboard para saber si el negocio va bien. Aumenta la percepción de valor del SaaS.

Ambas features comparten la misma infraestructura: **Vercel Cron Jobs** + el proveedor de email Resend (ya instalado en Sprint 2).

## What Changes

### Recordatorio Automático de Turno (Feature #8)
- Crear endpoint `GET /api/cron/recordatorios` protegido por `CRON_SECRET` header.
- El cron se ejecuta cada hora (`0 * * * *`). Busca bookings con `status=CONFIRMED` cuyo slot está entre 55 y 65 minutos en el futuro. Envía email de recordatorio al jugador.
- Configurar el cron en `vercel.json`.
- Persistir qué recordatorios ya se enviaron para evitar duplicados (campo `reminderSentAt` en `Booking` o tabla separada).

### Reporte Semanal al Dueño (Feature #9)
- Crear endpoint `GET /api/cron/reporte-semanal` protegido por `CRON_SECRET` header.
- El cron se ejecuta cada lunes a las 9am (`0 9 * * 1`). Para cada complejo activo (`subscriptionStatus=ACTIVE` o `TRIAL`), computa las métricas de la semana anterior usando la lógica existente en `src/lib/metrics.ts` y envía el resumen por email al admin del complejo.
- El email incluye: total reservas, ingresos confirmados, % ocupación, cancha más reservada y comparativa vs semana anterior.

## Capabilities

### New Capabilities
- `automatizaciones-cron`: Infraestructura de cron jobs en Vercel para recordatorios de turno y reportes semanales.

### Modified Capabilities
- `notificaciones-jugadores`: Extensión con recordatorios automáticos pre-turno.
- `flujo-reservas`: Nuevo campo `reminderSentAt` en `Booking` para deduplicar envíos.

## Impact
- **Database**: Un campo `reminderSentAt DateTime?` en el modelo `Booking` de Prisma (requiere migración).
- **Nueva variable de entorno**: `CRON_SECRET` para proteger los endpoints de cron de llamadas externas.
- **Nuevo archivo**: `vercel.json` con la configuración de crons.
- **APIs**: 2 nuevos endpoints GET protegidos por header secret.
- **Dependencia**: Resend (ya instalado en Sprint 2).
