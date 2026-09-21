# Spec: control-suscripcion

## Purpose
Establecer y gobernar el ciclo de vida de la suscripción de cada complejo deportivo (Trial, Período de Gracia, Activo, Suspendido), garantizando la continuidad de lectura de datos históricos y restringiendo las operaciones de escritura cuando la suscripción se encuentre vencida.

## Requirements

### Requirement: Cálculo Dinámico del Estado de Suscripción
El sistema SHALL calcular en tiempo de ejecución el estado de la suscripción de un complejo basándose en la fecha actual, `subscriptionStatus`, `trialEndsAt` y `gracePeriodDays`.

#### Scenario: Complejo dentro del período de prueba
- **WHEN** la fecha actual es menor o igual a `trialEndsAt` y el estado configurado es `TRIAL`
- **THEN** el sistema evalúa el estado como `TRIAL` e indica los días restantes de prueba.

#### Scenario: Complejo en período de gracia
- **WHEN** la fecha actual es mayor a `trialEndsAt` pero menor o igual a `trialEndsAt + gracePeriodDays`
- **THEN** el sistema evalúa el estado como `GRACE` y calcula los días restantes de gracia.

#### Scenario: Complejo con prueba y gracia vencidas
- **WHEN** la fecha actual supera `trialEndsAt + gracePeriodDays` y el complejo no ha sido marcado como `ACTIVE`
- **THEN** el sistema evalúa el estado efectivo como `SUSPENDED`.

#### Scenario: Complejo con suscripción pagada y activa
- **WHEN** el complejo tiene `subscriptionStatus = ACTIVE`
- **THEN** el sistema evalúa el estado como `ACTIVE` sin restricción de fechas.

### Requirement: Restricción de Operaciones en Modo Solo Lectura (Soft-Lock)
El sistema SHALL denegar operaciones de creación o modificación en el complejo cuando su estado efectivo sea `SUSPENDED` o `INACTIVE`.

#### Scenario: Intento de crear reserva manual con suscripción suspendida
- **WHEN** un usuario intenta registrar una reserva manual mediante `POST /api/dashboard/reservas/manual` para un complejo en estado `SUSPENDED`
- **THEN** el sistema rechaza la solicitud con código HTTP 402 y mensaje explicativo `SUBSCRIPTION_EXPIRED`.

#### Scenario: Consulta de información y lectura histórica con suscripción suspendida
- **WHEN** un usuario autenticado consulta la lista de reservas, calendario o métricas pasadas en el dashboard para un complejo en estado `SUSPENDED`
- **THEN** el sistema responde exitosamente con los datos permitiendo su visualización.

### Requirement: Alertas Visuales y Banners de Suscripción
El sistema SHALL mostrar en el layout del dashboard avisos informativos acordes al estado de la suscripción del complejo actual.

#### Scenario: Visualización de alerta en período de gracia
- **WHEN** un administrador de complejo accede al dashboard y el complejo se encuentra en estado `GRACE`
- **THEN** el sistema despliega un banner de advertencia destacando los días restantes antes del paso a modo solo lectura.

#### Scenario: Visualización de banner de cuenta suspendida
- **WHEN** un administrador de complejo accede al dashboard y el complejo se encuentra en estado `SUSPENDED`
- **THEN** el sistema despliega un banner persistente indicando que la cuenta está en modo solo lectura e invitando a contactar al administrador.

### Requirement: Gestión Administrativa de Suscripciones por SuperAdmin
El sistema SHALL permitir al SuperAdmin consultar y actualizar el estado de suscripción, extender días de prueba o activar suscripciones desde el panel `/admin/complejos`.

#### Scenario: Activación de suscripción por SuperAdmin
- **WHEN** el SuperAdmin envía una petición `PATCH /api/admin/complejos/[id]/suscripcion` con `{ status: "ACTIVE" }`
- **THEN** el sistema actualiza el estado del complejo a `ACTIVE` y desbloquea inmediatamente cualquier restricción de escritura.

#### Scenario: Extensión de días de prueba por SuperAdmin
- **WHEN** el SuperAdmin actualiza `trialEndsAt` o añade días de prueba adicionales a un complejo
- **THEN** el sistema recalcula la nueva fecha límite y restaura el estado del complejo a `TRIAL` si la fecha resulta en el futuro.
