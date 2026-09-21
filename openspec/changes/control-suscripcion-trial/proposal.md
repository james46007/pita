# Proposal: Control de Suscripción y Período de Prueba (Trial & Grace Period)

## Why

Actualmente, cada nuevo complejo deportivo registrado en la plataforma tiene acceso ilimitado e indefinido (`isActive: true`) sin ningún mecanismo de control de cobro ni vencimiento. Para que el SaaS sea viable comercialmente y permita cobrar por el uso de la plataforma a los dueños de los complejos sin alienar a los clientes existentes ni cortar abruptamente la operación, se requiere un sistema estructurado de:
1. **Período de prueba gratuito (Trial)** configurable (por defecto 30 días).
2. **Período de gracia (Grace Period)** con alertas preventivas (por defecto 5 días).
3. **Modo Solo Lectura (Soft-Lock / SUSPENDED)**: Los dueños de complejos vencidos pueden seguir viendo sus calendarios, históricos y clientes, pero se bloquea la creación de nuevas reservas y la edición operativa hasta que regularicen el pago.
4. **Control SuperAdmin**: Capacidad de activar suscripciones manualmente, extender días de prueba y suspender o reactivar complejos con un solo clic.

## What Changes

- **Esquema de Base de Datos**: Agregar enum `SubscriptionStatus` (`TRIAL`, `GRACE`, `ACTIVE`, `SUSPENDED`, `INACTIVE`) y campos `subscriptionStatus`, `trialEndsAt`, `trialDays`, y `gracePeriodDays` en el modelo `Complex`.
- **Motor de Estado de Suscripción**: Implementar `src/lib/subscription.ts` para calcular en tiempo real el estado dinámico del complejo (días restantes de trial, período de gracia, o suspensión).
- **Protección de Escritura (Soft-Lock)**: Agregar guard centralizado `assertSubscriptionWriteAccess` en los endpoints de mutación (`/api/dashboard/reservas`, `/api/dashboard/reservas/manual`, `/api/dashboard/canchas`) para rechazar acciones con HTTP 402 (`SUBSCRIPTION_EXPIRED`) si el complejo está en modo suspendido o inactivo.
- **Banners Informativos en Dashboard**: Integrar componente visual en el layout del dashboard que notifique los días restantes de prueba (azul/verde), advertencia urgente en período de gracia (naranja/rojo), o bloqueo de escritura con botón de contacto al administrador.
- **Gestión en Panel SuperAdmin**: Agregar en `/admin/complejos` una columna visual con el estado de suscripción y un modal o menú de acciones rápidas para activar suscripción, extender prueba y suspender.
- **Endpoint de Estado y Endpoint Administrativo**: Crear `GET /api/dashboard/suscripcion/estado` para consulta rápida del frontend del complejo y `PATCH /api/admin/complejos/[id]/suscripcion` para control por el SuperAdmin.

## Capabilities

### New Capabilities
- `control-suscripcion`: Gestión del ciclo de vida de la suscripción de cada complejo (Trial -> Grace -> Suspended / Active) y aplicación de restricciones operativas en modo solo lectura.

### Modified Capabilities
- `panel-superadmin`: Incorporación de controles administrativos para modificar estado de suscripción, extender días de prueba y consultar fecha de vencimiento por complejo.
- `dashboard-admin`: Visualización del banner de estado y cumplimiento de restricciones en endpoints de escritura.

## Impact

- **Database**: Migración de Prisma para añadir campos a `Complex`. Requiere valor por defecto adecuado para complejos ya existentes.
- **APIs**: Protección en endpoints de creación de reservas y canchas; nuevos endpoints para consulta y gestión de suscripción.
- **UI**: Modificación de `src/app/dashboard/layout.tsx` para incluir el banner informativo y de `src/app/admin/complejos/page.tsx` para controles de suscripción.
