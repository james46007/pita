# Design: Control de Suscripción y Período de Prueba

## Context

El modelo de negocio de la plataforma es B2B: el cliente directo es el dueño o administrador del complejo deportivo. El sistema actual crea complejos con `isActive: true` y no tiene límites temporales ni campos de control de facturación. Para monetizar el software garantizando una relación cordial y profesional con los dueños, se adopta la estrategia de **Soft-Lock con Grace Period**.

## Goals / Non-Goals

**Goals:**
- Proporcionar a cada nuevo complejo 30 días de prueba gratuita por defecto.
- Dar 5 días de período de gracia con alertas visibles antes de aplicar cualquier restricción.
- Aplicar un "Soft-Lock" al vencerse el plazo: el dueño puede ver su historial, clientes y métricas, pero no puede generar nuevas reservas ni modificar canchas.
- Proporcionar al SuperAdmin una interfaz sencilla para cambiar estados (marcar pagado / activo, prorrogar prueba o suspender).
- Informar de manera clara y no intrusiva mediante banners en el dashboard el tiempo restante de prueba y los pasos a seguir.

**Non-Goals:**
- Integrar pasarelas de pago automatizadas como Stripe o MercadoPago en esta fase (los cobros son gestionados de forma manual por transferencia/efectivo con el SuperAdmin).
- Bloquear la sesión del usuario por completo (evitamos dejar al dueño sin acceso a sus datos históricos).

## Decisions

### 1. Modelo de Datos y Estados

- **Decision**: Añadir al modelo `Complex`:
  - `subscriptionStatus`: Enum (`TRIAL`, `GRACE`, `ACTIVE`, `SUSPENDED`, `INACTIVE`), por defecto `TRIAL`.
  - `trialEndsAt`: `DateTime` (por defecto `now() + 30 días` al crearse).
  - `trialDays`: `Int` (default 30).
  - `gracePeriodDays`: `Int` (default 5).
- **Rationale**: Permite que tanto la duración del trial como la gracia sean configurables de manera individual para cada complejo si se negocia una condición especial con un cliente.

### 2. Cálculo Dinámico de Estado en Tiempo de Ejecución

- **Decision**: Implementar `getSubscriptionState(complex)` en `src/lib/subscription.ts`.
  - Si `subscriptionStatus === 'ACTIVE'`, el estado es `ACTIVE`.
  - Si `subscriptionStatus === 'INACTIVE'`, el estado es `INACTIVE`.
  - Si `subscriptionStatus === 'SUSPENDED'`, el estado es `SUSPENDED`.
  - Si `subscriptionStatus === 'TRIAL'`:
    - Si `now <= trialEndsAt` -> `TRIAL` (con `daysLeft`).
    - Si `now > trialEndsAt` y `now <= trialEndsAt + gracePeriodDays` -> `GRACE` (con `daysLeftInGrace`).
    - Si `now > trialEndsAt + gracePeriodDays` -> `SUSPENDED`.
- **Rationale**: No requiere un cron job para calcular el estado; cada consulta al complejo o intento de mutación evalúa la vigencia en milisegundos con respecto a `new Date()`.

### 3. Mecanismo de Soft-Lock (Guard de Escritura)

- **Decision**: Crear `assertSubscriptionWriteAccess(complexId: string)` que arroje `Error("SUBSCRIPTION_EXPIRED")`.
  - Se invoca al inicio de:
    - `POST /api/dashboard/reservas/manual`
    - `POST /api/dashboard/reservas` (o endpoint público de reserva)
    - `POST / PUT / DELETE /api/dashboard/canchas`
  - Si falla, responde con `HTTP 402 Payment Required` y cuerpo `{ error: "SUBSCRIPTION_EXPIRED", message: "El complejo se encuentra en modo solo lectura por vencimiento de suscripción." }`.

### 4. Experiencia de Usuario (Banners en Dashboard)

- **Decision**: Crear componente `SubscriptionBanner` cargado en `src/app/dashboard/layout.tsx`.
  - **TRIAL**: Banner informativo azul/verde cuando queden <= 10 días ("Te quedan X días de prueba gratuita").
  - **GRACE**: Banner amarillo/rojo ("Tu período de prueba ha terminado. Te quedan X días de gracia para regularizar el servicio").
  - **SUSPENDED**: Banner rojo persistente en la cabecera ("Tu cuenta está en modo solo lectura. Comunícate con el soporte para reactivar tu servicio").

## Risks / Trade-offs

- **[Complejos existentes sin `trialEndsAt`]** → En la migración y en el código se provee un fallback: si `trialEndsAt` es nulo o complejo previo, se le asigna 30 días a partir de la fecha de migración o estado `ACTIVE` para no interrumpir pilotos en marcha.
- **[Reservas en curso del portal público]** → Durante el período de gracia (5 días) las reservas públicas siguen funcionando, protegiendo las reservas de los jugadores mientras se gestiona el cobro con el dueño.
