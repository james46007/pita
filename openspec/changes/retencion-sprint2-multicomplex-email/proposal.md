# Proposal: Sprint 2 — Selector Multi-Complejo y Notificación de Confirmación por Email

## Why

Dos brechas críticas para retener al primer cliente y preparar el crecimiento:

1. **Multi-complejo**: Si el dueño administra 2 o más sedes, hoy no puede gestionarlas desde la misma cuenta sin cerrar sesión y volver a entrar. El modelo de datos ya soporta `UserComplex[]` pero el dashboard lo ignora, sirviendo siempre `complexes[0]`.

2. **Notificación de confirmación**: Cuando el admin confirma un comprobante de pago, el jugador no recibe ningún aviso automático. El dueño tiene que enviar un mensaje a mano por WhatsApp. Esto genera fricción operativa y baja la percepción de profesionalismo del sistema.

## What Changes

### Selector Multi-Complejo (Feature #6)
- Agregar en el sidebar del dashboard un selector de complejo activo visible solo cuando el usuario tiene más de 1 complejo asignado.
- El complejo activo se persiste en una cookie de sesión (`active-complex-id`) para que no se pierda al navegar.
- Todos los endpoints y consultas del dashboard leen el `complexId` activo desde la cookie cuando no se pasa como query param explícito.

### Notificación de Confirmación por Email (Feature #5)
- Instalar **Resend** como proveedor de email transaccional (plan gratuito: 3,000 emails/mes).
- Crear plantilla HTML de email de confirmación con: nombre del jugador, cancha, fecha, hora y nombre del complejo.
- Disparar el email automáticamente en `PATCH /api/dashboard/reservas/[id]` cuando `status` cambia a `CONFIRMED` y el booking tiene `customerEmail`.
- El email es opcional: si `customerEmail` está vacío, se omite el envío sin lanzar error.

## Capabilities

### New Capabilities
- `notificaciones-jugadores`: Envío de email transaccional al jugador cuando su reserva es confirmada.

### Modified Capabilities
- `dashboard-admin`: Selector de complejo activo en el sidebar para usuarios con múltiples complejos.
- `flujo-reservas`: Hook de notificación post-confirmación de comprobante.

## Impact
- **Nueva dependencia**: `resend` npm package.
- **Nueva variable de entorno**: `RESEND_API_KEY`.
- **APIs**: Modificación de `PATCH /api/dashboard/reservas/[id]` para disparar el email.
- **UI**: Selector de complejo en `src/app/dashboard/layout.tsx`. Lógica de cookie en middleware o layout.
- **Database**: Sin cambios de esquema.
